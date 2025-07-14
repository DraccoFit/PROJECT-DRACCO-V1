from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv
import openai
import asyncio
from enum import Enum
import json
import base64
from io import BytesIO
from PIL import Image
import requests

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token handling
security = HTTPBearer()

# OpenAI client
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# FastAPI app
app = FastAPI(title="Fitness App API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extremely_active = "extremely_active"

class Goal(str, Enum):
    lose_weight = "lose_weight"
    maintain_weight = "maintain_weight"
    gain_weight = "gain_weight"
    build_muscle = "build_muscle"
    improve_fitness = "improve_fitness"

class ExerciseType(str, Enum):
    cardio = "cardio"
    strength = "strength"
    flexibility = "flexibility"
    balance = "balance"
    sports = "sports"

class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserEvaluation(BaseModel):
    age: int
    gender: Gender
    weight: float
    height: float
    activity_level: ActivityLevel
    goal: Goal
    experience_level: DifficultyLevel
    health_conditions: List[str] = []
    food_preferences: List[str] = []
    food_allergies: List[str] = []
    available_days: List[str] = []
    preferred_workout_time: str = ""
    equipment_available: List[str] = []

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    evaluation: Optional[UserEvaluation] = None
    tmb: Optional[float] = None
    daily_calories: Optional[float] = None

class Exercise(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: ExerciseType
    difficulty: DifficultyLevel
    muscle_groups: List[str]
    equipment: List[str]
    instructions: List[str]
    duration_minutes: int
    calories_burned: int
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Food(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    calories_per_100g: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    category: str
    image_url: Optional[str] = None

class Meal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    foods: List[Dict[str, Any]]  # {food_id, quantity}
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    meal_type: str  # breakfast, lunch, dinner, snack
    instructions: str = ""

class NutritionPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_number: int
    daily_calories: float
    meals: Dict[str, List[Meal]]  # {day: [meals]}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    exercises: List[Dict[str, Any]]  # {exercise_id, sets, reps, weight, duration}
    total_duration: int
    difficulty: DifficultyLevel
    focus_areas: List[str]

class WorkoutPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_number: int
    sessions: Dict[str, WorkoutSession]  # {day: session}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProgressEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    weight: Optional[float] = None
    muscle_mass: Optional[float] = None
    body_fat: Optional[float] = None
    measurements: Dict[str, float] = {}  # chest, waist, hips, etc.
    photos: List[str] = []  # base64 encoded images
    notes: str = ""

class WaterIntake(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    amount_ml: float
    goal_ml: float = 2000

class WaterIntakeRequest(BaseModel):
    amount_ml: float
    goal_ml: float = 2000

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str  # reminder, motivation, alert
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForumPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    category: str
    likes: int = 0
    replies: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

def calculate_tmb(weight: float, height: float, age: int, gender: Gender) -> float:
    """Calculate Total Metabolic Rate using Harris-Benedict equation"""
    if gender == Gender.male:
        tmb = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    else:
        tmb = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    return tmb

def calculate_daily_calories(tmb: float, activity_level: ActivityLevel, goal: Goal) -> float:
    """Calculate daily calorie needs"""
    activity_multipliers = {
        ActivityLevel.sedentary: 1.2,
        ActivityLevel.lightly_active: 1.375,
        ActivityLevel.moderately_active: 1.55,
        ActivityLevel.very_active: 1.725,
        ActivityLevel.extremely_active: 1.9
    }
    
    maintenance_calories = tmb * activity_multipliers[activity_level]
    
    goal_adjustments = {
        Goal.lose_weight: -500,
        Goal.maintain_weight: 0,
        Goal.gain_weight: 500,
        Goal.build_muscle: 300,
        Goal.improve_fitness: 0
    }
    
    return maintenance_calories + goal_adjustments[goal]

async def generate_ai_response(user_message: str, user_context: dict) -> str:
    """Generate AI response using OpenAI"""
    if not OPENAI_API_KEY:
        return "AI chatbot no disponible. Por favor, configura tu clave API de OpenAI."
    
    try:
        system_prompt = f"""
        Eres un entrenador personal y nutricionista experto. El usuario tiene los siguientes datos:
        - Objetivo: {user_context.get('goal', 'No especificado')}
        - Nivel de actividad: {user_context.get('activity_level', 'No especificado')}
        - Experiencia: {user_context.get('experience_level', 'No especificado')}
        - Calorías diarias recomendadas: {user_context.get('daily_calories', 'No calculado')}
        
        Proporciona consejos útiles, motivación y respuestas personalizadas sobre fitness, nutrición y salud.
        Mantén un tono amigable y profesional. Si no tienes información suficiente, pide más detalles.
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error al generar respuesta: {str(e)}"

# API Routes

# Authentication
@api_router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# User Profile
@api_router.get("/profile", response_model=User)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/evaluation")
async def update_evaluation(evaluation: UserEvaluation, current_user: User = Depends(get_current_user)):
    # Calculate TMB and daily calories
    tmb = calculate_tmb(evaluation.weight, evaluation.height, evaluation.age, evaluation.gender)
    daily_calories = calculate_daily_calories(tmb, evaluation.activity_level, evaluation.goal)
    
    # Update user with evaluation and calculations
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "evaluation": evaluation.dict(),
            "tmb": tmb,
            "daily_calories": daily_calories
        }}
    )
    
    return {"message": "Evaluación actualizada exitosamente", "tmb": tmb, "daily_calories": daily_calories}

# Exercises
@api_router.get("/exercises", response_model=List[Exercise])
async def get_exercises(
    type: Optional[ExerciseType] = None,
    difficulty: Optional[DifficultyLevel] = None,
    muscle_group: Optional[str] = None
):
    query = {}
    if type:
        query["type"] = type
    if difficulty:
        query["difficulty"] = difficulty
    if muscle_group:
        query["muscle_groups"] = {"$in": [muscle_group]}
    
    exercises = await db.exercises.find(query).to_list(100)
    return [Exercise(**exercise) for exercise in exercises]

@api_router.post("/exercises", response_model=Exercise)
async def create_exercise(exercise: Exercise, current_user: User = Depends(get_current_user)):
    await db.exercises.insert_one(exercise.dict())
    return exercise

# Nutrition Plans
@api_router.get("/nutrition-plans", response_model=List[NutritionPlan])
async def get_nutrition_plans(current_user: User = Depends(get_current_user)):
    plans = await db.nutrition_plans.find({"user_id": current_user.id}).to_list(100)
    return [NutritionPlan(**plan) for plan in plans]

@api_router.post("/nutrition-plans/generate")
async def generate_nutrition_plan(current_user: User = Depends(get_current_user)):
    if not current_user.evaluation or not current_user.daily_calories:
        raise HTTPException(status_code=400, detail="Please complete your evaluation first")
    
    # This would generate a personalized nutrition plan based on user data
    # For now, we'll create a basic plan structure
    plan = NutritionPlan(
        user_id=current_user.id,
        week_number=1,
        daily_calories=current_user.daily_calories,
        meals={}  # This would be populated with actual meal data
    )
    
    await db.nutrition_plans.insert_one(plan.dict())
    return {"message": "Plan nutricional generado exitosamente", "plan_id": plan.id}

# Workout Plans
@api_router.get("/workout-plans", response_model=List[WorkoutPlan])
async def get_workout_plans(current_user: User = Depends(get_current_user)):
    plans = await db.workout_plans.find({"user_id": current_user.id}).to_list(100)
    return [WorkoutPlan(**plan) for plan in plans]

@api_router.post("/workout-plans/generate")
async def generate_workout_plan(current_user: User = Depends(get_current_user)):
    if not current_user.evaluation:
        raise HTTPException(status_code=400, detail="Please complete your evaluation first")
    
    # This would generate a personalized workout plan
    plan = WorkoutPlan(
        user_id=current_user.id,
        week_number=1,
        sessions={}  # This would be populated with actual workout sessions
    )
    
    await db.workout_plans.insert_one(plan.dict())
    return {"message": "Plan de entrenamiento generado exitosamente", "plan_id": plan.id}

# Progress Tracking
@api_router.post("/progress", response_model=ProgressEntry)
async def add_progress_entry(entry: ProgressEntry, current_user: User = Depends(get_current_user)):
    entry.user_id = current_user.id
    await db.progress.insert_one(entry.dict())
    return entry

@api_router.get("/progress", response_model=List[ProgressEntry])
async def get_progress(current_user: User = Depends(get_current_user)):
    entries = await db.progress.find({"user_id": current_user.id}).sort("date", -1).to_list(100)
    return [ProgressEntry(**entry) for entry in entries]

# Water Intake
@api_router.post("/water-intake", response_model=WaterIntake)
async def add_water_intake(intake_request: WaterIntakeRequest, current_user: User = Depends(get_current_user)):
    intake = WaterIntake(
        user_id=current_user.id,
        amount_ml=intake_request.amount_ml,
        goal_ml=intake_request.goal_ml
    )
    await db.water_intake.insert_one(intake.dict())
    return intake

@api_router.get("/water-intake/today")
async def get_today_water_intake(current_user: User = Depends(get_current_user)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    entries = await db.water_intake.find({
        "user_id": current_user.id,
        "date": {"$gte": today, "$lt": tomorrow}
    }).to_list(100)
    
    # Convert entries to proper format, excluding MongoDB _id field
    clean_entries = []
    for entry in entries:
        if "_id" in entry:
            del entry["_id"]
        clean_entries.append(entry)
    
    total_intake = sum(entry["amount_ml"] for entry in clean_entries)
    return {"total_intake": total_intake, "goal": 2000, "entries": clean_entries}

# AI Chatbot
@api_router.post("/chat")
async def chat_with_ai(message: str, current_user: User = Depends(get_current_user)):
    user_context = {
        "goal": current_user.evaluation.goal if current_user.evaluation else None,
        "activity_level": current_user.evaluation.activity_level if current_user.evaluation else None,
        "experience_level": current_user.evaluation.experience_level if current_user.evaluation else None,
        "daily_calories": current_user.daily_calories
    }
    
    response = await generate_ai_response(message, user_context)
    
    # Save chat history
    chat_message = ChatMessage(
        user_id=current_user.id,
        message=message,
        response=response
    )
    await db.chat_history.insert_one(chat_message.dict())
    
    return {"response": response}

@api_router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(current_user: User = Depends(get_current_user)):
    messages = await db.chat_history.find({"user_id": current_user.id}).sort("timestamp", -1).to_list(50)
    return [ChatMessage(**msg) for msg in messages]

# Notifications
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [Notification(**notif) for notif in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notificación marcada como leída"}

# Forum
@api_router.get("/forum", response_model=List[ForumPost])
async def get_forum_posts(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    posts = await db.forum_posts.find(query).sort("created_at", -1).to_list(100)
    return [ForumPost(**post) for post in posts]

@api_router.post("/forum", response_model=ForumPost)
async def create_forum_post(post: ForumPost, current_user: User = Depends(get_current_user)):
    post.user_id = current_user.id
    await db.forum_posts.insert_one(post.dict())
    return post

# Food Database
@api_router.get("/foods", response_model=List[Food])
async def get_foods(search: Optional[str] = None):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    foods = await db.foods.find(query).to_list(100)
    return [Food(**food) for food in foods]

# Initialize default data
@api_router.post("/initialize-data")
async def initialize_default_data():
    # Check if exercises already exist
    existing_exercises = await db.exercises.count_documents({})
    if existing_exercises > 0:
        return {"message": "Data already initialized"}
    
    # Default exercises
    default_exercises = [
        {
            "id": str(uuid.uuid4()),
            "name": "Push-ups",
            "description": "Classic upper body exercise",
            "type": "strength",
            "difficulty": "beginner",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "equipment": [],
            "instructions": [
                "Start in plank position",
                "Lower body until chest nearly touches floor",
                "Push back up to starting position"
            ],
            "duration_minutes": 15,
            "calories_burned": 80,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Squats",
            "description": "Lower body compound exercise",
            "type": "strength",
            "difficulty": "beginner",
            "muscle_groups": ["quadriceps", "glutes", "hamstrings"],
            "equipment": [],
            "instructions": [
                "Stand with feet hip-width apart",
                "Lower body as if sitting back into chair",
                "Return to standing position"
            ],
            "duration_minutes": 20,
            "calories_burned": 100,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Running",
            "description": "Cardiovascular exercise",
            "type": "cardio",
            "difficulty": "intermediate",
            "muscle_groups": ["legs", "core"],
            "equipment": ["running shoes"],
            "instructions": [
                "Start with warm-up walk",
                "Gradually increase pace",
                "Maintain steady rhythm"
            ],
            "duration_minutes": 30,
            "calories_burned": 300,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.exercises.insert_many(default_exercises)
    
    # Default foods
    default_foods = [
        {
            "id": str(uuid.uuid4()),
            "name": "Chicken Breast",
            "calories_per_100g": 165,
            "protein": 31,
            "carbs": 0,
            "fat": 3.6,
            "fiber": 0,
            "sugar": 0,
            "sodium": 74,
            "category": "protein"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Brown Rice",
            "calories_per_100g": 123,
            "protein": 2.6,
            "carbs": 23,
            "fat": 0.9,
            "fiber": 1.8,
            "sugar": 0.4,
            "sodium": 7,
            "category": "carbs"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Broccoli",
            "calories_per_100g": 34,
            "protein": 2.8,
            "carbs": 7,
            "fat": 0.4,
            "fiber": 2.6,
            "sugar": 1.5,
            "sodium": 33,
            "category": "vegetables"
        }
    ]
    
    await db.foods.insert_many(default_foods)
    
    return {"message": "Default data initialized successfully"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include router in main app
app.include_router(api_router)