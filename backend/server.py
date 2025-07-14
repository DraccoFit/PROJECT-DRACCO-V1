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
import math

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
app = FastAPI(title="DRACCO API", version="1.0.0")
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
    video_thumbnail: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Advanced fields
    secondary_muscles: List[str] = []
    preparation_steps: List[str] = []
    common_mistakes: List[str] = []
    variations: List[str] = []
    safety_tips: List[str] = []
    progression_tips: List[str] = []
    breathing_pattern: str = ""
    rest_between_sets: int = 60  # seconds
    intensity_level: int = 5  # 1-10 scale
    tags: List[str] = []
    created_by: str = "system"
    rating: float = 0.0
    review_count: int = 0

class ExerciseFilter(BaseModel):
    name: Optional[str] = None
    type: Optional[ExerciseType] = None
    difficulty: Optional[DifficultyLevel] = None
    muscle_groups: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    duration_range: Optional[Dict[str, int]] = None  # {"min": 10, "max": 60}
    calories_range: Optional[Dict[str, int]] = None
    intensity_range: Optional[Dict[str, int]] = None
    tags: Optional[List[str]] = None
    has_video: Optional[bool] = None
    sort_by: Optional[str] = "name"  # name, difficulty, calories, rating, created_at
    sort_order: Optional[str] = "asc"  # asc, desc
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class ExerciseReview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exercise_id: str
    user_id: str
    rating: int  # 1-5 stars
    comment: Optional[str] = None
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
    # Advanced nutritional data
    saturated_fat: float = 0.0
    trans_fat: float = 0.0
    cholesterol: float = 0.0
    potassium: float = 0.0
    calcium: float = 0.0
    iron: float = 0.0
    vitamin_c: float = 0.0
    vitamin_a: float = 0.0
    vitamin_d: float = 0.0
    vitamin_b12: float = 0.0
    folate: float = 0.0
    magnesium: float = 0.0
    phosphorus: float = 0.0
    zinc: float = 0.0
    # Additional metadata
    glycemic_index: Optional[int] = None
    allergens: List[str] = []
    dietary_flags: List[str] = []  # vegetarian, vegan, gluten-free, etc.
    serving_size: float = 100.0  # grams
    barcode: Optional[str] = None
    brand: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FoodComparison(BaseModel):
    foods: List[str]  # List of food IDs
    comparison_type: str = "nutritional"  # nutritional, caloric, protein, etc.
    serving_size: float = 100.0  # grams

class NutritionLabel(BaseModel):
    food_id: str
    serving_size: float
    nutritional_data: Dict[str, Any]
    health_score: float
    recommendations: List[str]

class Supplement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # protein, vitamins, minerals, etc.
    description: str
    benefits: List[str]
    dosage: str
    timing: str  # pre-workout, post-workout, with meals, etc.
    side_effects: List[str] = []
    contraindications: List[str] = []
    price_range: Optional[Dict[str, float]] = None  # {"min": 20, "max": 50}
    rating: float = 0.0
    image_url: Optional[str] = None
    suitable_for: List[str] = []  # goals, conditions, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SupplementRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    supplement_id: str
    reason: str
    priority: int  # 1-5, higher is more important
    confidence: float  # 0-1
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
    tips: List[str] = []
    shopping_list: List[str] = []
    plan_name: str = "Plan Nutricional Personalizado"

class ShoppingList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan_id: Optional[str] = None
    name: str = "Lista de Compras"
    items: List[Dict[str, Any]]  # Enhanced structure
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = False
    total_estimated_cost: Optional[float] = None
    store_suggestions: List[str] = []
    categories: List[str] = []

class ShoppingItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: str
    unit: str = "unidades"
    category: str
    purchased: bool = False
    price: Optional[float] = None
    brand_preference: Optional[str] = None
    alternatives: List[str] = []
    notes: Optional[str] = None
    nutritional_priority: Optional[str] = None  # high, medium, low
    urgency: Optional[str] = None  # urgent, normal, optional

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

class HealthMetrics(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    bmi: float
    body_fat_percentage: Optional[float] = None
    muscle_mass_percentage: Optional[float] = None
    visceral_fat_level: Optional[int] = None
    metabolic_age: Optional[int] = None
    bone_mass: Optional[float] = None
    water_percentage: Optional[float] = None
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    bmi_category: str = ""
    health_status: str = ""
    recommendations: List[str] = []

class BodyMeasurements(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    weight: Optional[float] = None
    height: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    neck: Optional[float] = None
    bicep: Optional[float] = None
    thigh: Optional[float] = None
    forearm: Optional[float] = None
    calf: Optional[float] = None

class HealthMetricsRequest(BaseModel):
    weight: float
    height: float
    age: int
    gender: str
    activity_level: str
    body_fat_percentage: Optional[float] = None
    neck_circumference: Optional[float] = None
    waist_circumference: Optional[float] = None
    hip_circumference: Optional[float] = None

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

def calculate_bmi(weight: float, height: float) -> float:
    """Calculate Body Mass Index"""
    height_m = height / 100  # Convert cm to meters
    return weight / (height_m ** 2)

def get_bmi_category(bmi: float) -> str:
    """Get BMI category based on BMI value"""
    if bmi < 18.5:
        return "Bajo peso"
    elif bmi < 25:
        return "Peso normal"
    elif bmi < 30:
        return "Sobrepeso"
    else:
        return "Obesidad"

def calculate_body_fat_percentage(gender: str, age: int, bmi: float) -> float:
    """Calculate body fat percentage using BMI formula"""
    if gender.lower() == "male":
        body_fat = (1.20 * bmi) + (0.23 * age) - 16.2
    else:  # female
        body_fat = (1.20 * bmi) + (0.23 * age) - 5.4
    
    return max(0, min(100, body_fat))  # Clamp between 0 and 100

def calculate_body_fat_navy(gender: str, height: float, neck: float, waist: float, hip: float = None) -> float:
    """Calculate body fat percentage using Navy method"""
    if gender.lower() == "male":
        body_fat = 495 / (1.0324 - 0.19077 * math.log10(waist - neck) + 0.15456 * math.log10(height)) - 450
    else:  # female
        if hip is None:
            return 0
        body_fat = 495 / (1.29579 - 0.35004 * math.log10(waist + hip - neck) + 0.22100 * math.log10(height)) - 450
    
    return max(0, min(100, body_fat))

def calculate_ideal_weight(height: float, gender: str) -> tuple:
    """Calculate ideal weight range using multiple formulas"""
    height_m = height / 100
    
    # BMI-based ideal weight (BMI 18.5-24.9)
    min_weight = 18.5 * (height_m ** 2)
    max_weight = 24.9 * (height_m ** 2)
    
    # Hamwi formula
    if gender.lower() == "male":
        hamwi_weight = 48 + 2.7 * ((height - 152.4) / 2.54)
    else:  # female
        hamwi_weight = 45.5 + 2.2 * ((height - 152.4) / 2.54)
    
    # Devine formula
    if gender.lower() == "male":
        devine_weight = 50 + 2.3 * ((height - 152.4) / 2.54)
    else:  # female
        devine_weight = 45.5 + 2.3 * ((height - 152.4) / 2.54)
    
    return {
        "bmi_range": {"min": round(min_weight, 1), "max": round(max_weight, 1)},
        "hamwi": round(hamwi_weight, 1),
        "devine": round(devine_weight, 1)
    }

def calculate_daily_calorie_needs(weight: float, height: float, age: int, gender: str, activity_level: str) -> dict:
    """Calculate daily calorie needs using multiple formulas"""
    # Harris-Benedict Equation
    if gender.lower() == "male":
        bmr_harris = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    else:
        bmr_harris = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    
    # Mifflin-St Jeor Equation (more accurate)
    if gender.lower() == "male":
        bmr_mifflin = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr_mifflin = (10 * weight) + (6.25 * height) - (5 * age) - 161
    
    # Activity multipliers
    activity_multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extremely_active": 1.9
    }
    
    multiplier = activity_multipliers.get(activity_level, 1.2)
    
    return {
        "bmr_harris": round(bmr_harris, 0),
        "bmr_mifflin": round(bmr_mifflin, 0),
        "tdee_harris": round(bmr_harris * multiplier, 0),
        "tdee_mifflin": round(bmr_mifflin * multiplier, 0),
        "recommended_bmr": round(bmr_mifflin, 0),  # Mifflin is more accurate
        "recommended_tdee": round(bmr_mifflin * multiplier, 0)
    }

def build_exercise_query(filters: ExerciseFilter) -> dict:
    """Build MongoDB query from exercise filters"""
    query = {}
    
    if filters.name:
        query["name"] = {"$regex": filters.name, "$options": "i"}
    
    if filters.type:
        query["type"] = filters.type
    
    if filters.difficulty:
        query["difficulty"] = filters.difficulty
    
    if filters.muscle_groups:
        query["muscle_groups"] = {"$in": filters.muscle_groups}
    
    if filters.equipment:
        query["equipment"] = {"$in": filters.equipment}
    
    if filters.duration_range:
        duration_query = {}
        if "min" in filters.duration_range:
            duration_query["$gte"] = filters.duration_range["min"]
        if "max" in filters.duration_range:
            duration_query["$lte"] = filters.duration_range["max"]
        if duration_query:
            query["duration_minutes"] = duration_query
    
    if filters.calories_range:
        calories_query = {}
        if "min" in filters.calories_range:
            calories_query["$gte"] = filters.calories_range["min"]
        if "max" in filters.calories_range:
            calories_query["$lte"] = filters.calories_range["max"]
        if calories_query:
            query["calories_burned"] = calories_query
    
    if filters.intensity_range:
        intensity_query = {}
        if "min" in filters.intensity_range:
            intensity_query["$gte"] = filters.intensity_range["min"]
        if "max" in filters.intensity_range:
            intensity_query["$lte"] = filters.intensity_range["max"]
        if intensity_query:
            query["intensity_level"] = intensity_query
    
    if filters.tags:
        query["tags"] = {"$in": filters.tags}
    
    if filters.has_video is not None:
        if filters.has_video:
            query["video_url"] = {"$ne": None, "$ne": ""}
        else:
            query["$or"] = [
                {"video_url": {"$exists": False}},
                {"video_url": None},
                {"video_url": ""}
            ]
    
    return query

def calculate_food_health_score(food: dict) -> float:
    """Calculate health score for a food item (0-100)"""
    score = 50  # Base score
    
    # Protein bonus
    protein_per_100_cal = (food.get("protein", 0) * 4) / max(food.get("calories_per_100g", 1), 1) * 100
    score += min(protein_per_100_cal * 0.3, 20)
    
    # Fiber bonus
    fiber_per_100_cal = food.get("fiber", 0) / max(food.get("calories_per_100g", 1), 1) * 100
    score += min(fiber_per_100_cal * 0.5, 15)
    
    # Sugar penalty
    sugar_per_100_cal = food.get("sugar", 0) / max(food.get("calories_per_100g", 1), 1) * 100
    score -= min(sugar_per_100_cal * 0.2, 15)
    
    # Sodium penalty
    sodium_per_100_cal = food.get("sodium", 0) / max(food.get("calories_per_100g", 1), 1) * 100
    score -= min(sodium_per_100_cal * 0.1, 10)
    
    # Saturated fat penalty
    saturated_fat_per_100_cal = (food.get("saturated_fat", 0) * 9) / max(food.get("calories_per_100g", 1), 1) * 100
    score -= min(saturated_fat_per_100_cal * 0.1, 10)
    
    # Trans fat penalty
    trans_fat = food.get("trans_fat", 0)
    if trans_fat > 0:
        score -= 20
    
    # Vitamin and mineral bonus
    vitamins_minerals = ["vitamin_c", "vitamin_a", "vitamin_d", "calcium", "iron", "potassium"]
    for nutrient in vitamins_minerals:
        if food.get(nutrient, 0) > 0:
            score += 2
    
    return max(0, min(100, score))

def generate_supplement_recommendations(user_evaluation: dict, health_metrics: dict) -> List[dict]:
    """Generate personalized supplement recommendations"""
    recommendations = []
    
    goal = user_evaluation.get("goal", "")
    age = user_evaluation.get("age", 25)
    gender = user_evaluation.get("gender", "")
    activity_level = user_evaluation.get("activity_level", "")
    
    # Basic recommendations for everyone
    basic_supplements = [
        {
            "name": "Multivitamínico",
            "category": "vitamins",
            "reason": "Cubre deficiencias nutricionales básicas",
            "priority": 3,
            "confidence": 0.8
        },
        {
            "name": "Omega-3",
            "category": "fatty_acids",
            "reason": "Mejora la salud cardiovascular y reduce la inflamación",
            "priority": 3,
            "confidence": 0.7
        }
    ]
    
    # Goal-specific recommendations
    if goal == "build_muscle" or goal == "gain_weight":
        recommendations.extend([
            {
                "name": "Proteína Whey",
                "category": "protein",
                "reason": "Apoya el crecimiento muscular y recuperación",
                "priority": 5,
                "confidence": 0.9
            },
            {
                "name": "Creatina",
                "category": "performance",
                "reason": "Mejora la fuerza y potencia muscular",
                "priority": 4,
                "confidence": 0.8
            }
        ])
    
    elif goal == "lose_weight":
        recommendations.extend([
            {
                "name": "L-Carnitina",
                "category": "fat_burner",
                "reason": "Ayuda en la oxidación de grasas",
                "priority": 3,
                "confidence": 0.6
            },
            {
                "name": "Fibra",
                "category": "digestive",
                "reason": "Aumenta la saciedad y mejora la digestión",
                "priority": 3,
                "confidence": 0.7
            }
        ])
    
    # Activity level recommendations
    if activity_level in ["very_active", "extremely_active"]:
        recommendations.extend([
            {
                "name": "BCAA",
                "category": "amino_acids",
                "reason": "Reduce la fatiga muscular durante entrenamientos intensos",
                "priority": 3,
                "confidence": 0.7
            },
            {
                "name": "Magnesio",
                "category": "minerals",
                "reason": "Mejora la recuperación muscular y calidad del sueño",
                "priority": 3,
                "confidence": 0.8
            }
        ])
    
    # Age-specific recommendations
    if age > 40:
        recommendations.extend([
            {
                "name": "Vitamina D3",
                "category": "vitamins",
                "reason": "Mantiene la salud ósea y función inmune",
                "priority": 4,
                "confidence": 0.8
            },
            {
                "name": "Colágeno",
                "category": "joints",
                "reason": "Apoya la salud articular y de la piel",
                "priority": 3,
                "confidence": 0.7
            }
        ])
    
    # Gender-specific recommendations
    if gender == "female":
        recommendations.extend([
            {
                "name": "Hierro",
                "category": "minerals",
                "reason": "Previene la anemia ferropénica",
                "priority": 4,
                "confidence": 0.7
            },
            {
                "name": "Ácido Fólico",
                "category": "vitamins",
                "reason": "Importante para la salud reproductiva",
                "priority": 3,
                "confidence": 0.8
            }
        ])
    
    # Add basic supplements
    recommendations.extend(basic_supplements)
    
    # Remove duplicates and sort by priority
    unique_recommendations = {}
    for rec in recommendations:
        if rec["name"] not in unique_recommendations:
            unique_recommendations[rec["name"]] = rec
    
    return sorted(unique_recommendations.values(), key=lambda x: x["priority"], reverse=True)

def generate_smart_shopping_list(nutrition_plan: dict, user_preferences: dict) -> dict:
    """Generate intelligent shopping list from nutrition plan"""
    shopping_items = []
    categories = set()
    
    # Extract ingredients from nutrition plan
    ingredients_count = {}
    
    for day, meals in nutrition_plan.get("meals", {}).items():
        for meal in meals:
            if isinstance(meal, dict) and "ingredients" in meal:
                for ingredient in meal["ingredients"]:
                    if ingredient in ingredients_count:
                        ingredients_count[ingredient] += 1
                    else:
                        ingredients_count[ingredient] = 1
    
    # Convert to shopping items with smart categorization
    for ingredient, count in ingredients_count.items():
        category = categorize_ingredient(ingredient)
        categories.add(category)
        
        # Determine quantity based on frequency
        if count <= 2:
            quantity = "1-2"
        elif count <= 5:
            quantity = "3-5"
        else:
            quantity = "6+"
        
        shopping_item = {
            "name": ingredient,
            "quantity": quantity,
            "unit": "unidades",
            "category": category,
            "purchased": False,
            "nutritional_priority": determine_nutritional_priority(ingredient),
            "urgency": "normal"
        }
        
        shopping_items.append(shopping_item)
    
    # Add staples if not present
    staples = [
        {"name": "Aceite de oliva", "category": "Aceites y condimentos", "quantity": "1", "urgency": "normal"},
        {"name": "Sal", "category": "Aceites y condimentos", "quantity": "1", "urgency": "normal"},
        {"name": "Pimienta", "category": "Aceites y condimentos", "quantity": "1", "urgency": "normal"},
    ]
    
    existing_items = [item["name"].lower() for item in shopping_items]
    for staple in staples:
        if staple["name"].lower() not in existing_items:
            shopping_items.append(staple)
            categories.add(staple["category"])
    
    # Sort by category and priority
    shopping_items.sort(key=lambda x: (x["category"], x.get("nutritional_priority", "medium")))
    
    return {
        "items": shopping_items,
        "categories": list(categories),
        "total_items": len(shopping_items),
        "estimated_cost": estimate_shopping_cost(shopping_items)
    }

def categorize_ingredient(ingredient: str) -> str:
    """Categorize ingredient for shopping list"""
    ingredient_lower = ingredient.lower()
    
    if any(word in ingredient_lower for word in ["pollo", "carne", "pescado", "atún", "salmón", "pavo"]):
        return "Carnes y pescados"
    elif any(word in ingredient_lower for word in ["leche", "yogur", "queso", "huevo"]):
        return "Lácteos y huevos"
    elif any(word in ingredient_lower for word in ["manzana", "plátano", "naranja", "fresa", "uva"]):
        return "Frutas"
    elif any(word in ingredient_lower for word in ["lechuga", "tomate", "cebolla", "zanahoria", "brócoli"]):
        return "Verduras"
    elif any(word in ingredient_lower for word in ["arroz", "pasta", "pan", "avena", "quinoa"]):
        return "Cereales y granos"
    elif any(word in ingredient_lower for word in ["aceite", "sal", "pimienta", "ajo", "especias"]):
        return "Aceites y condimentos"
    elif any(word in ingredient_lower for word in ["nuez", "almendra", "cacahuete", "semilla"]):
        return "Frutos secos y semillas"
    else:
        return "Otros"

def determine_nutritional_priority(ingredient: str) -> str:
    """Determine nutritional priority of ingredient"""
    ingredient_lower = ingredient.lower()
    
    high_priority = ["proteína", "pollo", "pescado", "huevo", "quinoa", "avena", "brócoli", "espinaca"]
    medium_priority = ["arroz", "pasta", "leche", "yogur", "manzana", "plátano"]
    
    if any(word in ingredient_lower for word in high_priority):
        return "high"
    elif any(word in ingredient_lower for word in medium_priority):
        return "medium"
    else:
        return "low"

def estimate_shopping_cost(items: List[dict]) -> float:
    """Estimate total cost of shopping list"""
    # This is a simplified estimation - in production, you'd use real price data
    cost_per_category = {
        "Carnes y pescados": 8.0,
        "Lácteos y huevos": 3.5,
        "Frutas": 2.5,
        "Verduras": 2.0,
        "Cereales y granos": 1.5,
        "Aceites y condimentos": 4.0,
        "Frutos secos y semillas": 6.0,
        "Otros": 3.0
    }
    
    total_cost = 0
    for item in items:
        category = item.get("category", "Otros")
        base_cost = cost_per_category.get(category, 3.0)
        
        # Adjust based on quantity
        quantity = item.get("quantity", "1")
        if "3-5" in quantity:
            multiplier = 4
        elif "6+" in quantity:
            multiplier = 7
        else:
            multiplier = 1.5
        
        total_cost += base_cost * multiplier
    
    return round(total_cost, 2)

def generate_health_recommendations(bmi: float, body_fat: float, age: int, gender: str, goal: str) -> list:
    """Generate personalized health recommendations"""
    recommendations = []
    
    # BMI-based recommendations
    if bmi < 18.5:
        recommendations.append("Considera aumentar tu ingesta calórica de manera saludable")
        recommendations.append("Incluye más proteínas y grasas saludables en tu dieta")
        recommendations.append("Consulta con un nutricionista para un plan personalizado")
    elif bmi > 25:
        recommendations.append("Considera reducir tu ingesta calórica gradualmente")
        recommendations.append("Aumenta tu actividad física diaria")
        recommendations.append("Enfócate en alimentos nutritivos y bajos en calorías")
    
    # Body fat recommendations
    if gender.lower() == "male":
        if body_fat > 25:
            recommendations.append("Tu porcentaje de grasa corporal es elevado, considera ejercicio cardiovascular")
        elif body_fat < 6:
            recommendations.append("Tu porcentaje de grasa corporal es muy bajo, asegúrate de mantener una nutrición adecuada")
    else:  # female
        if body_fat > 32:
            recommendations.append("Tu porcentaje de grasa corporal es elevado, considera ejercicio cardiovascular")
        elif body_fat < 14:
            recommendations.append("Tu porcentaje de grasa corporal es muy bajo, asegúrate de mantener una nutrición adecuada")
    
    # Age-based recommendations
    if age > 40:
        recommendations.append("Incluye ejercicios de resistencia para mantener la masa muscular")
        recommendations.append("Considera suplementos de calcio y vitamina D")
    
    # Goal-based recommendations
    if goal == "lose_weight":
        recommendations.append("Crea un déficit calórico moderado (300-500 cal/día)")
        recommendations.append("Combina ejercicio cardiovascular con entrenamiento de fuerza")
    elif goal == "gain_weight":
        recommendations.append("Aumenta tu ingesta calórica con alimentos nutritivos")
        recommendations.append("Enfócate en entrenamiento de fuerza para ganar masa muscular")
    elif goal == "build_muscle":
        recommendations.append("Consume suficientes proteínas (1.6-2.2g por kg de peso)")
        recommendations.append("Prioriza ejercicios compuestos en tu entrenamiento")
    
    # General recommendations
    recommendations.append("Mantén una hidratación adecuada (2-3 litros de agua al día)")
    recommendations.append("Asegúrate de dormir 7-9 horas cada noche")
    recommendations.append("Realiza chequeos médicos regulares")
    
    return recommendations

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

async def generate_nutrition_plan_ai(user_evaluation: dict, daily_calories: float) -> dict:
    """Generate AI-powered nutrition plan"""
    if not OPENAI_API_KEY:
        return {"error": "OpenAI API key not configured"}
    
    try:
        # Create detailed prompt for nutrition plan generation
        prompt = f"""
        Genera un plan nutricional semanal detallado para un usuario con las siguientes características:
        
        DATOS DEL USUARIO:
        - Edad: {user_evaluation.get('age', 'No especificado')} años
        - Género: {user_evaluation.get('gender', 'No especificado')}
        - Peso: {user_evaluation.get('weight', 'No especificado')} kg
        - Altura: {user_evaluation.get('height', 'No especificado')} cm
        - Nivel de actividad: {user_evaluation.get('activity_level', 'No especificado')}
        - Objetivo: {user_evaluation.get('goal', 'No especificado')}
        - Calorías diarias: {daily_calories} kcal
        - Preferencias alimentarias: {user_evaluation.get('food_preferences', [])}
        - Alergias: {user_evaluation.get('food_allergies', [])}
        - Condiciones de salud: {user_evaluation.get('health_conditions', [])}
        
        INSTRUCCIONES:
        1. Crea un plan para 7 días (Lunes a Domingo)
        2. Incluye 4 comidas por día: Desayuno, Almuerzo, Merienda, Cena
        3. Cada comida debe tener: nombre, ingredientes, calorías aproximadas, proteínas, carbohidratos, grasas
        4. Respeta las preferencias alimentarias y alergias
        5. Ajusta las porciones según el objetivo (perder, mantener o ganar peso)
        6. Incluye consejos nutricionales específicos
        
        FORMATO DE RESPUESTA (JSON):
        {{
            "plan_name": "Plan Nutricional Personalizado",
            "total_calories": {daily_calories},
            "duration": "7 días",
            "days": {{
                "Lunes": {{
                    "Desayuno": {{
                        "name": "Nombre del platillo",
                        "ingredients": ["ingrediente1", "ingrediente2"],
                        "calories": 450,
                        "protein": 20,
                        "carbs": 50,
                        "fat": 15,
                        "instructions": "Instrucciones de preparación"
                    }},
                    "Almuerzo": {{ ... }},
                    "Merienda": {{ ... }},
                    "Cena": {{ ... }}
                }},
                "Martes": {{ ... }},
                ... (continúa para todos los días)
            }},
            "tips": [
                "Consejo nutricional 1",
                "Consejo nutricional 2",
                "Consejo nutricional 3"
            ],
            "shopping_list": [
                "Producto 1",
                "Producto 2",
                "Producto 3"
            ]
        }}
        
        Responde SOLO con el JSON válido, sin explicaciones adicionales.
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un nutricionista experto que crea planes alimentarios personalizados. Responde siempre en formato JSON válido."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.3
        )
        
        # Parse the JSON response
        ai_response = response.choices[0].message.content
        
        # Clean the response (remove any markdown formatting)
        ai_response = ai_response.strip()
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:]
        if ai_response.endswith('```'):
            ai_response = ai_response[:-3]
        
        nutrition_plan = json.loads(ai_response)
        return nutrition_plan
        
    except json.JSONDecodeError as e:
        return {"error": f"Error parsing AI response: {str(e)}"}
    except Exception as e:
        return {"error": f"Error generating nutrition plan: {str(e)}"}

async def generate_workout_plan_ai(user_evaluation: dict, user_id: str) -> dict:
    """Generate AI-powered workout plan"""
    if not OPENAI_API_KEY:
        return {"error": "OpenAI API key not configured"}
    
    try:
        # Create detailed prompt for workout plan generation
        prompt = f"""
        Genera un plan de entrenamiento semanal detallado para un usuario con las siguientes características:
        
        DATOS DEL USUARIO:
        - Edad: {user_evaluation.get('age', 'No especificado')} años
        - Género: {user_evaluation.get('gender', 'No especificado')}
        - Nivel de actividad: {user_evaluation.get('activity_level', 'No especificado')}
        - Objetivo: {user_evaluation.get('goal', 'No especificado')}
        - Nivel de experiencia: {user_evaluation.get('experience_level', 'beginner')}
        - Días disponibles: {user_evaluation.get('available_days', [])}
        - Equipo disponible: {user_evaluation.get('equipment_available', [])}
        - Condiciones de salud: {user_evaluation.get('health_conditions', [])}
        
        INSTRUCCIONES:
        1. Crea un plan semanal considerando los días disponibles del usuario
        2. Cada sesión debe incluir:
           - Nombre descriptivo
           - Lista de ejercicios con series, repeticiones y peso/intensidad
           - Duración total aproximada
           - Áreas de enfoque
           - Nivel de dificultad adaptado
        3. Respeta las limitaciones de equipo y salud
        4. Adapta la intensidad al nivel de experiencia
        5. Incluye variedad de ejercicios y progresión
        
        FORMATO DE RESPUESTA (JSON):
        {{
            "plan_name": "Plan de Entrenamiento Personalizado",
            "user_id": "{user_id}",
            "duration": "7 días",
            "workouts": {{
                "Lunes": {{
                    "name": "Entrenamiento de Fuerza - Tren Superior",
                    "exercises": [
                        {{
                            "name": "Flexiones de pecho",
                            "sets": 3,
                            "reps": "10-12",
                            "weight": "Peso corporal",
                            "rest": "60 segundos",
                            "notes": "Mantén la forma correcta"
                        }},
                        {{
                            "name": "Dominadas asistidas",
                            "sets": 3,
                            "reps": "8-10",
                            "weight": "Peso corporal",
                            "rest": "90 segundos",
                            "notes": "Usa banda elástica si es necesario"
                        }}
                    ],
                    "duration": 45,
                    "focus_areas": ["Pecho", "Espalda", "Brazos"],
                    "difficulty": "intermediate"
                }},
                "Martes": {{
                    "name": "Cardio y Core",
                    "exercises": [
                        {{
                            "name": "Burpees",
                            "sets": 4,
                            "reps": "8-10",
                            "weight": "Peso corporal",
                            "rest": "60 segundos",
                            "notes": "Mantén un ritmo constante"
                        }}
                    ],
                    "duration": 30,
                    "focus_areas": ["Cardio", "Core"],
                    "difficulty": "intermediate"
                }},
                ... (continúa para todos los días disponibles)
            }},
            "recommendations": [
                "Calienta siempre antes de entrenar",
                "Mantén una buena hidratación",
                "Descansa al menos 48 horas entre entrenamientos del mismo grupo muscular"
            ]
        }}
        
        Responde SOLO con el JSON válido, sin explicaciones adicionales.
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un entrenador personal experto que crea planes de entrenamiento personalizados. Responde siempre en formato JSON válido."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.3
        )
        
        # Parse the JSON response
        ai_response = response.choices[0].message.content
        
        # Clean the response (remove any markdown formatting)
        ai_response = ai_response.strip()
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:]
        if ai_response.endswith('```'):
            ai_response = ai_response[:-3]
        
        workout_plan = json.loads(ai_response)
        return workout_plan
        
    except json.JSONDecodeError as e:
        return {"error": f"Error parsing AI response: {str(e)}"}
    except Exception as e:
        return {"error": f"Error generating workout plan: {str(e)}"}

async def generate_meal_alternatives(original_meal: dict, user_preferences: list, allergies: list) -> list:
    """Generate alternative meals based on user preferences and allergies"""
    if not OPENAI_API_KEY:
        return []
    
    try:
        prompt = f"""
        Genera 3 alternativas para esta comida:
        
        COMIDA ORIGINAL:
        - Nombre: {original_meal.get('name', '')}
        - Ingredientes: {original_meal.get('ingredients', [])}
        - Calorías: {original_meal.get('calories', 0)}
        - Proteínas: {original_meal.get('protein', 0)}g
        - Carbohidratos: {original_meal.get('carbs', 0)}g
        - Grasas: {original_meal.get('fat', 0)}g
        
        RESTRICCIONES:
        - Preferencias: {user_preferences}
        - Alergias: {allergies}
        - Mantener valores nutricionales similares (±10%)
        
        FORMATO JSON:
        {{
            "alternatives": [
                {{
                    "name": "Nombre alternativo 1",
                    "ingredients": ["ingrediente1", "ingrediente2"],
                    "calories": 450,
                    "protein": 20,
                    "carbs": 50,
                    "fat": 15,
                    "instructions": "Instrucciones breves"
                }},
                {{
                    "name": "Nombre alternativo 2",
                    "ingredients": ["ingrediente1", "ingrediente2"],
                    "calories": 460,
                    "protein": 22,
                    "carbs": 48,
                    "fat": 16,
                    "instructions": "Instrucciones breves"
                }},
                {{
                    "name": "Nombre alternativo 3",
                    "ingredients": ["ingrediente1", "ingrediente2"],
                    "calories": 440,
                    "protein": 19,
                    "carbs": 52,
                    "fat": 14,
                    "instructions": "Instrucciones breves"
                }}
            ]
        }}
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un chef nutricionista que crea alternativas de comidas saludables. Responde solo en JSON válido."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.5
        )
        
        ai_response = response.choices[0].message.content.strip()
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:]
        if ai_response.endswith('```'):
            ai_response = ai_response[:-3]
        
        alternatives = json.loads(ai_response)
        return alternatives.get('alternatives', [])
        
    except Exception as e:
        return []
async def generate_workout_plan_ai(user_evaluation: dict, user_id: str) -> dict:
    """Generate AI-powered workout plan"""
    if not OPENAI_API_KEY:
        return {"error": "OpenAI API key not configured"}
    
    try:
        # Create detailed prompt for workout plan generation
        prompt = f"""
        Genera un plan de entrenamiento semanal detallado para un usuario con las siguientes características:
        
        DATOS DEL USUARIO:
        - Edad: {user_evaluation.get('age', 'No especificado')} años
        - Género: {user_evaluation.get('gender', 'No especificado')}
        - Nivel de actividad: {user_evaluation.get('activity_level', 'No especificado')}
        - Objetivo: {user_evaluation.get('goal', 'No especificado')}
        - Nivel de experiencia: {user_evaluation.get('experience_level', 'beginner')}
        - Días disponibles: {user_evaluation.get('available_days', [])}
        - Equipo disponible: {user_evaluation.get('equipment_available', [])}
        - Condiciones de salud: {user_evaluation.get('health_conditions', [])}
        
        INSTRUCCIONES:
        1. Crea un plan semanal considerando los días disponibles del usuario
        2. Cada sesión debe incluir:
           - Nombre descriptivo
           - Lista de ejercicios con series, repeticiones y peso/intensidad
           - Duración total aproximada
           - Áreas de enfoque
           - Nivel de dificultad adaptado
        3. Respeta las limitaciones de equipo y salud
        4. Adapta la intensidad al nivel de experiencia
        5. Incluye variedad de ejercicios y progresión
        
        Genera un plan de entrenamiento en formato JSON que incluya:
        1. Nombre del plan
        2. ID del usuario
        3. Duración (7 días)
        4. Entrenamientos por día con:
           - Nombre del entrenamiento
           - Lista de ejercicios (nombre, series, repeticiones, peso/intensidad, descanso, notas)
           - Duración total
           - Áreas de enfoque
           - Nivel de dificultad
        5. Recomendaciones generales
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un entrenador personal experto que crea planes de entrenamiento personalizados. Responde siempre en formato JSON válido."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.3
        )
        
        # Parse the JSON response
        ai_response = response.choices[0].message.content
        
        # Clean the response (remove any markdown formatting)
        ai_response = ai_response.strip()
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:]
        if ai_response.endswith('```'):
            ai_response = ai_response[:-3]
        
        workout_plan = json.loads(ai_response)
        return workout_plan
        
    except json.JSONDecodeError as e:
        return {"error": f"Error parsing AI response: {str(e)}"}
    except Exception as e:
        return {"error": f"Error generating workout plan: {str(e)}"}


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
    
    # Generate AI-powered nutrition plan
    ai_plan = await generate_nutrition_plan_ai(current_user.evaluation, current_user.daily_calories)
    
    if "error" in ai_plan:
        raise HTTPException(status_code=500, detail=ai_plan["error"])
    
    # Convert AI plan to database format
    meals_by_day = {}
    for day, day_meals in ai_plan.get("days", {}).items():
        daily_meals = []
        for meal_type, meal_data in day_meals.items():
            meal = Meal(
                name=meal_data.get("name", ""),
                foods=[],  # We'll populate this with actual food IDs later
                total_calories=meal_data.get("calories", 0),
                total_protein=meal_data.get("protein", 0),
                total_carbs=meal_data.get("carbs", 0),
                total_fat=meal_data.get("fat", 0),
                meal_type=meal_type.lower(),
                instructions=meal_data.get("instructions", "")
            )
            daily_meals.append(meal)
        meals_by_day[day] = daily_meals
    
    # Create nutrition plan
    plan = NutritionPlan(
        user_id=current_user.id,
        week_number=1,
        daily_calories=current_user.daily_calories,
        meals={day: [meal.dict() for meal in meals] for day, meals in meals_by_day.items()}
    )
    
    await db.nutrition_plans.insert_one(plan.dict())
    
    # Return the AI-generated plan with additional info
    return {
        "message": "Plan nutricional generado exitosamente",
        "plan_id": plan.id,
        "plan_details": ai_plan,
        "tips": ai_plan.get("tips", []),
        "shopping_list": ai_plan.get("shopping_list", [])
    }

@api_router.get("/nutrition-plans/{plan_id}")
async def get_nutrition_plan_details(plan_id: str, current_user: User = Depends(get_current_user)):
    plan = await db.nutrition_plans.find_one({"id": plan_id, "user_id": current_user.id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return NutritionPlan(**plan)

@api_router.post("/nutrition-plans/{plan_id}/alternatives")
async def get_meal_alternatives(
    plan_id: str,
    day: str,
    meal_type: str,
    current_user: User = Depends(get_current_user)
):
    # Get the plan
    plan = await db.nutrition_plans.find_one({"id": plan_id, "user_id": current_user.id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get the specific meal
    day_meals = plan.get("meals", {}).get(day, [])
    target_meal = None
    for meal in day_meals:
        if meal.get("meal_type") == meal_type.lower():
            target_meal = meal
            break
    
    if not target_meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    # Generate alternatives
    user_preferences = current_user.evaluation.get("food_preferences", []) if current_user.evaluation else []
    user_allergies = current_user.evaluation.get("food_allergies", []) if current_user.evaluation else []
    
    alternatives = await generate_meal_alternatives(target_meal, user_preferences, user_allergies)
    
    return {
        "original_meal": target_meal,
        "alternatives": alternatives
    }

# Shopping Lists
@api_router.post("/shopping-lists/generate/{plan_id}")
async def generate_shopping_list(plan_id: str, current_user: User = Depends(get_current_user)):
    # Get the nutrition plan
    plan = await db.nutrition_plans.find_one({"id": plan_id, "user_id": current_user.id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Extract ingredients from all meals
    all_ingredients = []
    for day, meals in plan.get("meals", {}).items():
        for meal in meals:
            if isinstance(meal, dict) and "name" in meal:
                # This is a simplified approach - in a real app, you'd parse ingredients more carefully
                meal_name = meal.get("name", "")
                all_ingredients.append(f"Ingredientes para {meal_name}")
    
    # Get shopping list from the plan if available
    shopping_items = plan.get("shopping_list", [])
    if not shopping_items:
        shopping_items = all_ingredients
    
    # Create shopping list items with categories
    categorized_items = []
    for item in shopping_items:
        categorized_items.append({
            "name": item,
            "quantity": "1",
            "category": "General",
            "purchased": False
        })
    
    # Create shopping list
    shopping_list = ShoppingList(
        user_id=current_user.id,
        plan_id=plan_id,
        items=categorized_items
    )
    
    await db.shopping_lists.insert_one(shopping_list.dict())
    
    return {
        "message": "Lista de compras generada exitosamente",
        "shopping_list_id": shopping_list.id,
        "items": categorized_items
    }

@api_router.get("/shopping-lists")
async def get_shopping_lists(current_user: User = Depends(get_current_user)):
    lists = await db.shopping_lists.find({"user_id": current_user.id}).to_list(100)
    return [ShoppingList(**shopping_list) for shopping_list in lists]

@api_router.put("/shopping-lists/{list_id}/items/{item_index}")
async def update_shopping_item(
    list_id: str,
    item_index: int,
    purchased: bool,
    current_user: User = Depends(get_current_user)
):
    # Get the shopping list
    shopping_list = await db.shopping_lists.find_one({"id": list_id, "user_id": current_user.id})
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    # Update the item
    items = shopping_list.get("items", [])
    if 0 <= item_index < len(items):
        items[item_index]["purchased"] = purchased
        
        # Update the shopping list
        await db.shopping_lists.update_one(
            {"id": list_id, "user_id": current_user.id},
            {"$set": {"items": items}}
        )
        
        return {"message": "Item actualizado exitosamente"}
    else:
        raise HTTPException(status_code=404, detail="Item not found")

# Nutritional Analysis
@api_router.get("/nutrition-analysis/{plan_id}")
async def get_nutrition_analysis(plan_id: str, current_user: User = Depends(get_current_user)):
    plan = await db.nutrition_plans.find_one({"id": plan_id, "user_id": current_user.id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate weekly nutritional summary
    weekly_calories = 0
    weekly_protein = 0
    weekly_carbs = 0
    weekly_fat = 0
    
    daily_averages = {}
    meal_distribution = {"desayuno": 0, "almuerzo": 0, "merienda": 0, "cena": 0}
    
    for day, meals in plan.get("meals", {}).items():
        daily_calories = 0
        daily_protein = 0
        daily_carbs = 0
        daily_fat = 0
        
        for meal in meals:
            if isinstance(meal, dict):
                calories = meal.get("total_calories", 0)
                protein = meal.get("total_protein", 0)
                carbs = meal.get("total_carbs", 0)
                fat = meal.get("total_fat", 0)
                
                daily_calories += calories
                daily_protein += protein
                daily_carbs += carbs
                daily_fat += fat
                
                meal_type = meal.get("meal_type", "").lower()
                if meal_type in meal_distribution:
                    meal_distribution[meal_type] += calories
        
        daily_averages[day] = {
            "calories": daily_calories,
            "protein": daily_protein,
            "carbs": daily_carbs,
            "fat": daily_fat
        }
        
        weekly_calories += daily_calories
        weekly_protein += daily_protein
        weekly_carbs += daily_carbs
        weekly_fat += daily_fat
    
    # Calculate averages
    num_days = len(daily_averages)
    if num_days > 0:
        avg_calories = weekly_calories / num_days
        avg_protein = weekly_protein / num_days
        avg_carbs = weekly_carbs / num_days
        avg_fat = weekly_fat / num_days
    else:
        avg_calories = avg_protein = avg_carbs = avg_fat = 0
    
    # Calculate macro percentages
    total_cals_from_macros = (avg_protein * 4) + (avg_carbs * 4) + (avg_fat * 9)
    if total_cals_from_macros > 0:
        protein_percentage = (avg_protein * 4 / total_cals_from_macros) * 100
        carbs_percentage = (avg_carbs * 4 / total_cals_from_macros) * 100
        fat_percentage = (avg_fat * 9 / total_cals_from_macros) * 100
    else:
        protein_percentage = carbs_percentage = fat_percentage = 0
    
    return {
        "plan_id": plan_id,
        "weekly_summary": {
            "total_calories": weekly_calories,
            "total_protein": weekly_protein,
            "total_carbs": weekly_carbs,
            "total_fat": weekly_fat
        },
        "daily_averages": {
            "calories": round(avg_calories, 2),
            "protein": round(avg_protein, 2),
            "carbs": round(avg_carbs, 2),
            "fat": round(avg_fat, 2)
        },
        "macro_distribution": {
            "protein": round(protein_percentage, 1),
            "carbs": round(carbs_percentage, 1),
            "fat": round(fat_percentage, 1)
        },
        "meal_distribution": meal_distribution,
        "daily_breakdown": daily_averages,
        "target_calories": plan.get("daily_calories", 0),
        "calorie_variance": round(avg_calories - plan.get("daily_calories", 0), 2)
    }

# Workout Plans
@api_router.get("/workout-plans", response_model=List[WorkoutPlan])
async def get_workout_plans(current_user: User = Depends(get_current_user)):
    plans = await db.workout_plans.find({"user_id": current_user.id}).to_list(100)
    return [WorkoutPlan(**plan) for plan in plans]

@api_router.post("/workout-plans/generate")
async def generate_workout_plan(current_user: User = Depends(get_current_user)):
    if not current_user.evaluation:
        raise HTTPException(status_code=400, detail="Please complete your evaluation first")
    
    # Generate AI-powered workout plan
    ai_plan = await generate_workout_plan_ai(current_user.evaluation, current_user.id)
    
    if "error" in ai_plan:
        raise HTTPException(status_code=500, detail=ai_plan["error"])
    
    # Convert AI plan to database format
    sessions_by_day = {}
    for day, workout_data in ai_plan.get("workouts", {}).items():
        if workout_data:  # Only add if there's actually a workout for this day
            workout_session = WorkoutSession(
                name=workout_data.get("name", f"Entrenamiento {day}"),
                exercises=workout_data.get("exercises", []),
                total_duration=workout_data.get("duration", 60),
                difficulty=DifficultyLevel(current_user.evaluation.get("experience_level", "beginner")),
                focus_areas=workout_data.get("focus_areas", [])
            )
            sessions_by_day[day] = workout_session
    
    # Create workout plan
    plan = WorkoutPlan(
        user_id=current_user.id,
        week_number=1,
        sessions={day: session.dict() for day, session in sessions_by_day.items()}
    )
    
    await db.workout_plans.insert_one(plan.dict())
    
    return {
        "message": "Plan de entrenamiento generado exitosamente",
        "plan_id": plan.id,
        "plan_details": ai_plan,
        "total_workouts": len(sessions_by_day),
        "weekly_schedule": list(sessions_by_day.keys())
    }

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

# Advanced Exercise Library
@api_router.post("/exercises/search")
async def search_exercises(filters: ExerciseFilter):
    """Advanced exercise search with filtering"""
    try:
        # Build query
        query = build_exercise_query(filters)
        
        # Build sort criteria
        sort_criteria = []
        if filters.sort_by == "rating":
            sort_criteria.append(("rating", -1 if filters.sort_order == "desc" else 1))
        elif filters.sort_by == "calories":
            sort_criteria.append(("calories_burned", -1 if filters.sort_order == "desc" else 1))
        elif filters.sort_by == "difficulty":
            sort_criteria.append(("difficulty", -1 if filters.sort_order == "desc" else 1))
        else:
            sort_criteria.append(("name", 1))
        
        # Execute query
        cursor = db.exercises.find(query)
        if sort_criteria:
            cursor = cursor.sort(sort_criteria)
        
        cursor = cursor.skip(filters.offset or 0).limit(filters.limit or 50)
        exercises = await cursor.to_list(length=filters.limit or 50)
        
        # Get total count
        total_count = await db.exercises.count_documents(query)
        
        return {
            "exercises": exercises,
            "total_count": total_count,
            "filters_applied": filters.dict(),
            "pagination": {
                "offset": filters.offset or 0,
                "limit": filters.limit or 50,
                "has_more": total_count > (filters.offset or 0) + len(exercises)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching exercises: {str(e)}")

@api_router.get("/exercises/{exercise_id}")
async def get_exercise_details(exercise_id: str):
    """Get detailed information about a specific exercise"""
    exercise = await db.exercises.find_one({"id": exercise_id})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Get reviews for this exercise
    reviews = await db.exercise_reviews.find({"exercise_id": exercise_id}).to_list(100)
    
    # Calculate average rating
    if reviews:
        avg_rating = sum(review["rating"] for review in reviews) / len(reviews)
        exercise["rating"] = round(avg_rating, 1)
        exercise["review_count"] = len(reviews)
    
    return {
        "exercise": exercise,
        "reviews": reviews[:10],  # Return first 10 reviews
        "total_reviews": len(reviews)
    }

@api_router.post("/exercises/{exercise_id}/review")
async def add_exercise_review(
    exercise_id: str,
    rating: int,
    comment: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Add a review for an exercise"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if exercise exists
    exercise = await db.exercises.find_one({"id": exercise_id})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Check if user already reviewed this exercise
    existing_review = await db.exercise_reviews.find_one({
        "exercise_id": exercise_id,
        "user_id": current_user.id
    })
    
    if existing_review:
        # Update existing review
        await db.exercise_reviews.update_one(
            {"exercise_id": exercise_id, "user_id": current_user.id},
            {"$set": {"rating": rating, "comment": comment}}
        )
    else:
        # Create new review
        review = ExerciseReview(
            exercise_id=exercise_id,
            user_id=current_user.id,
            rating=rating,
            comment=comment
        )
        await db.exercise_reviews.insert_one(review.dict())
    
    return {"message": "Review added successfully"}

@api_router.get("/exercises/categories/stats")
async def get_exercise_categories_stats():
    """Get statistics about exercise categories"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$type",
                    "count": {"$sum": 1},
                    "avg_duration": {"$avg": "$duration_minutes"},
                    "avg_calories": {"$avg": "$calories_burned"},
                    "avg_rating": {"$avg": "$rating"}
                }
            }
        ]
        
        stats = await db.exercises.aggregate(pipeline).to_list(100)
        
        return {
            "category_stats": stats,
            "total_exercises": sum(stat["count"] for stat in stats)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting exercise stats: {str(e)}")

# Food Comparison Tool
@api_router.post("/foods/compare")
async def compare_foods(comparison: FoodComparison):
    """Compare nutritional values of multiple foods"""
    try:
        # Get food data
        foods = await db.foods.find({"id": {"$in": comparison.foods}}).to_list(100)
        
        if len(foods) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 foods to compare")
        
        # Calculate nutritional values per serving
        comparison_data = []
        for food in foods:
            serving_multiplier = comparison.serving_size / food.get("serving_size", 100)
            
            nutritional_data = {
                "id": food["id"],
                "name": food["name"],
                "serving_size": comparison.serving_size,
                "calories": round(food["calories_per_100g"] * serving_multiplier, 1),
                "protein": round(food["protein"] * serving_multiplier, 1),
                "carbs": round(food["carbs"] * serving_multiplier, 1),
                "fat": round(food["fat"] * serving_multiplier, 1),
                "fiber": round(food["fiber"] * serving_multiplier, 1),
                "sugar": round(food["sugar"] * serving_multiplier, 1),
                "sodium": round(food["sodium"] * serving_multiplier, 1),
                "saturated_fat": round(food.get("saturated_fat", 0) * serving_multiplier, 1),
                "calcium": round(food.get("calcium", 0) * serving_multiplier, 1),
                "iron": round(food.get("iron", 0) * serving_multiplier, 1),
                "vitamin_c": round(food.get("vitamin_c", 0) * serving_multiplier, 1),
                "health_score": calculate_food_health_score(food)
            }
            
            comparison_data.append(nutritional_data)
        
        # Generate comparison insights
        insights = generate_food_comparison_insights(comparison_data)
        
        return {
            "comparison_data": comparison_data,
            "insights": insights,
            "serving_size": comparison.serving_size,
            "comparison_type": comparison.comparison_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing foods: {str(e)}")

@api_router.get("/foods/search")
async def search_foods(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_protein: Optional[float] = None,
    max_calories: Optional[float] = None,
    dietary_flags: Optional[str] = None,
    limit: int = 50
):
    """Search foods with various filters"""
    try:
        query = {}
        
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        
        if category:
            query["category"] = category
        
        if min_protein is not None:
            query["protein"] = {"$gte": min_protein}
        
        if max_calories is not None:
            query["calories_per_100g"] = {"$lte": max_calories}
        
        if dietary_flags:
            flags = dietary_flags.split(",")
            query["dietary_flags"] = {"$in": flags}
        
        foods = await db.foods.find(query).limit(limit).to_list(limit)
        
        # Calculate health scores
        for food in foods:
            food["health_score"] = calculate_food_health_score(food)
        
        return {
            "foods": foods,
            "total_found": len(foods),
            "query_applied": query
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching foods: {str(e)}")

@api_router.post("/foods/{food_id}/nutrition-label")
async def get_nutrition_label(food_id: str, serving_size: float = 100):
    """Generate detailed nutrition label for a food"""
    try:
        food = await db.foods.find_one({"id": food_id})
        if not food:
            raise HTTPException(status_code=404, detail="Food not found")
        
        serving_multiplier = serving_size / food.get("serving_size", 100)
        
        nutritional_data = {
            "serving_size": serving_size,
            "calories": round(food["calories_per_100g"] * serving_multiplier, 1),
            "macronutrients": {
                "protein": round(food["protein"] * serving_multiplier, 1),
                "carbs": round(food["carbs"] * serving_multiplier, 1),
                "fat": round(food["fat"] * serving_multiplier, 1),
                "fiber": round(food["fiber"] * serving_multiplier, 1),
                "sugar": round(food["sugar"] * serving_multiplier, 1)
            },
            "micronutrients": {
                "sodium": round(food["sodium"] * serving_multiplier, 1),
                "calcium": round(food.get("calcium", 0) * serving_multiplier, 1),
                "iron": round(food.get("iron", 0) * serving_multiplier, 1),
                "vitamin_c": round(food.get("vitamin_c", 0) * serving_multiplier, 1),
                "vitamin_a": round(food.get("vitamin_a", 0) * serving_multiplier, 1),
                "potassium": round(food.get("potassium", 0) * serving_multiplier, 1)
            },
            "fats": {
                "saturated_fat": round(food.get("saturated_fat", 0) * serving_multiplier, 1),
                "trans_fat": round(food.get("trans_fat", 0) * serving_multiplier, 1),
                "cholesterol": round(food.get("cholesterol", 0) * serving_multiplier, 1)
            }
        }
        
        health_score = calculate_food_health_score(food)
        
        # Generate recommendations
        recommendations = []
        if health_score >= 80:
            recommendations.append("Excelente elección nutricional")
        elif health_score >= 60:
            recommendations.append("Buena opción nutricional")
        else:
            recommendations.append("Consumir con moderación")
        
        if food["protein"] >= 15:
            recommendations.append("Alta en proteína")
        if food["fiber"] >= 5:
            recommendations.append("Buena fuente de fibra")
        if food["sugar"] >= 15:
            recommendations.append("Alto contenido de azúcar")
        if food["sodium"] >= 400:
            recommendations.append("Alto contenido de sodio")
        
        return {
            "food_name": food["name"],
            "nutritional_data": nutritional_data,
            "health_score": health_score,
            "recommendations": recommendations,
            "dietary_flags": food.get("dietary_flags", []),
            "allergens": food.get("allergens", [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating nutrition label: {str(e)}")

# Smart Shopping List Generator
@api_router.post("/shopping-lists/generate-smart/{plan_id}")
async def generate_smart_shopping_list_from_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Generate intelligent shopping list from nutrition plan"""
    try:
        # Get the nutrition plan
        plan = await db.nutrition_plans.find_one({"id": plan_id, "user_id": current_user.id})
        if not plan:
            raise HTTPException(status_code=404, detail="Nutrition plan not found")
        
        # Get user preferences
        user_preferences = current_user.evaluation.dict() if current_user.evaluation else {}
        
        # Generate smart shopping list
        shopping_data = generate_smart_shopping_list(plan, user_preferences)
        
        # Create shopping list
        shopping_list = ShoppingList(
            user_id=current_user.id,
            plan_id=plan_id,
            name=f"Lista para {plan.get('plan_name', 'Plan Nutricional')}",
            items=shopping_data["items"],
            total_estimated_cost=shopping_data["estimated_cost"],
            categories=shopping_data["categories"]
        )
        
        await db.shopping_lists.insert_one(shopping_list.dict())
        
        return {
            "message": "Lista de compras inteligente generada exitosamente",
            "shopping_list_id": shopping_list.id,
            "items": shopping_data["items"],
            "categories": shopping_data["categories"],
            "total_items": shopping_data["total_items"],
            "estimated_cost": shopping_data["estimated_cost"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating smart shopping list: {str(e)}")

@api_router.get("/shopping-lists/{list_id}/optimize")
async def optimize_shopping_list(
    list_id: str,
    current_user: User = Depends(get_current_user)
):
    """Optimize shopping list by grouping items and suggesting alternatives"""
    try:
        shopping_list = await db.shopping_lists.find_one({"id": list_id, "user_id": current_user.id})
        if not shopping_list:
            raise HTTPException(status_code=404, detail="Shopping list not found")
        
        items = shopping_list.get("items", [])
        
        # Group items by category
        grouped_items = {}
        for item in items:
            category = item.get("category", "Otros")
            if category not in grouped_items:
                grouped_items[category] = []
            grouped_items[category].append(item)
        
        # Generate store suggestions
        store_suggestions = [
            "Supermercado central para productos básicos",
            "Mercado local para frutas y verduras frescas",
            "Carnicería especializada para carnes"
        ]
        
        # Suggest item alternatives
        alternatives = {}
        for item in items:
            if item["name"].lower() in ["pollo", "carne de res"]:
                alternatives[item["name"]] = ["pescado", "tofu", "lentejas"]
            elif item["name"].lower() in ["leche"]:
                alternatives[item["name"]] = ["leche de almendras", "leche de avena"]
        
        return {
            "grouped_items": grouped_items,
            "store_suggestions": store_suggestions,
            "alternatives": alternatives,
            "optimization_tips": [
                "Compra frutas y verduras de temporada",
                "Considera productos congelados para mayor durabilidad",
                "Aprovecha ofertas en productos no perecederos"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing shopping list: {str(e)}")

# Supplement Recommendations
@api_router.get("/supplements/recommendations")
async def get_supplement_recommendations(current_user: User = Depends(get_current_user)):
    """Get personalized supplement recommendations"""
    try:
        if not current_user.evaluation:
            raise HTTPException(status_code=400, detail="Please complete your evaluation first")
        
        # Get latest health metrics
        health_metrics = await db.health_metrics.find_one(
            {"user_id": current_user.id},
            sort=[("calculated_at", -1)]
        )
        
        # Generate recommendations
        recommendations = generate_supplement_recommendations(
            current_user.evaluation,
            health_metrics.dict() if health_metrics else {}
        )
        
        # Save recommendations to database
        for rec in recommendations:
            supplement_rec = SupplementRecommendation(
                user_id=current_user.id,
                supplement_id=rec["name"],  # In a real app, this would be a proper ID
                reason=rec["reason"],
                priority=rec["priority"],
                confidence=rec["confidence"]
            )
            await db.supplement_recommendations.insert_one(supplement_rec.dict())
        
        return {
            "recommendations": recommendations,
            "total_recommendations": len(recommendations),
            "personalization_factors": {
                "goal": current_user.evaluation.get("goal"),
                "activity_level": current_user.evaluation.get("activity_level"),
                "age": current_user.evaluation.get("age"),
                "gender": current_user.evaluation.get("gender")
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating supplement recommendations: {str(e)}")

@api_router.get("/supplements/search")
async def search_supplements(
    q: Optional[str] = None,
    category: Optional[str] = None,
    goal: Optional[str] = None,
    price_range: Optional[str] = None,
    limit: int = 50
):
    """Search supplements with filters"""
    try:
        query = {}
        
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        
        if category:
            query["category"] = category
        
        if goal:
            query["suitable_for"] = {"$in": [goal]}
        
        if price_range:
            price_min, price_max = map(float, price_range.split("-"))
            query["price_range.min"] = {"$gte": price_min}
            query["price_range.max"] = {"$lte": price_max}
        
        supplements = await db.supplements.find(query).limit(limit).to_list(limit)
        
        return {
            "supplements": supplements,
            "total_found": len(supplements),
            "query_applied": query
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching supplements: {str(e)}")

@api_router.get("/supplements/{supplement_id}")
async def get_supplement_details(supplement_id: str):
    """Get detailed information about a specific supplement"""
    supplement = await db.supplements.find_one({"id": supplement_id})
    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")
    
    # Get user reviews/ratings if available
    reviews = await db.supplement_reviews.find({"supplement_id": supplement_id}).to_list(100)
    
    return {
        "supplement": supplement,
        "reviews": reviews[:10],
        "total_reviews": len(reviews)
    }

def generate_food_comparison_insights(comparison_data: List[dict]) -> List[str]:
    """Generate insights from food comparison data"""
    insights = []
    
    # Find best in each category
    best_protein = max(comparison_data, key=lambda x: x["protein"])
    best_fiber = max(comparison_data, key=lambda x: x["fiber"])
    lowest_calories = min(comparison_data, key=lambda x: x["calories"])
    lowest_sugar = min(comparison_data, key=lambda x: x["sugar"])
    highest_health_score = max(comparison_data, key=lambda x: x["health_score"])
    
    insights.append(f"Mayor proteína: {best_protein['name']} ({best_protein['protein']}g)")
    insights.append(f"Mayor fibra: {best_fiber['name']} ({best_fiber['fiber']}g)")
    insights.append(f"Menor calorías: {lowest_calories['name']} ({lowest_calories['calories']} cal)")
    insights.append(f"Menor azúcar: {lowest_sugar['name']} ({lowest_sugar['sugar']}g)")
    insights.append(f"Mejor puntuación de salud: {highest_health_score['name']} ({highest_health_score['health_score']}/100)")
    
    return insights

# Health Metrics
@api_router.post("/health-metrics/calculate")
async def calculate_health_metrics(
    metrics_request: HealthMetricsRequest,
    current_user: User = Depends(get_current_user)
):
    """Calculate comprehensive health metrics"""
    try:
        # Calculate BMI
        bmi = calculate_bmi(metrics_request.weight, metrics_request.height)
        bmi_category = get_bmi_category(bmi)
        
        # Calculate body fat percentage
        body_fat_bmi = calculate_body_fat_percentage(
            metrics_request.gender, 
            metrics_request.age, 
            bmi
        )
        
        # Calculate body fat using Navy method if measurements are provided
        body_fat_navy = None
        if (metrics_request.neck_circumference and 
            metrics_request.waist_circumference):
            body_fat_navy = calculate_body_fat_navy(
                metrics_request.gender,
                metrics_request.height,
                metrics_request.neck_circumference,
                metrics_request.waist_circumference,
                metrics_request.hip_circumference
            )
        
        # Use provided body fat percentage or calculated one
        body_fat = (metrics_request.body_fat_percentage or 
                   body_fat_navy or 
                   body_fat_bmi)
        
        # Calculate ideal weight
        ideal_weight = calculate_ideal_weight(
            metrics_request.height, 
            metrics_request.gender
        )
        
        # Calculate daily calorie needs
        calorie_needs = calculate_daily_calorie_needs(
            metrics_request.weight,
            metrics_request.height,
            metrics_request.age,
            metrics_request.gender,
            metrics_request.activity_level
        )
        
        # Generate health recommendations
        recommendations = generate_health_recommendations(
            bmi, 
            body_fat, 
            metrics_request.age, 
            metrics_request.gender, 
            "maintain_weight"  # Default goal
        )
        
        # Create health metrics record
        health_metrics = HealthMetrics(
            user_id=current_user.id,
            bmi=round(bmi, 1),
            body_fat_percentage=round(body_fat, 1),
            bmi_category=bmi_category,
            health_status="Normal" if 18.5 <= bmi <= 24.9 else "Fuera del rango normal",
            recommendations=recommendations
        )
        
        # Save to database
        await db.health_metrics.insert_one(health_metrics.dict())
        
        return {
            "message": "Métricas de salud calculadas exitosamente",
            "metrics": {
                "bmi": round(bmi, 1),
                "bmi_category": bmi_category,
                "body_fat_percentage": round(body_fat, 1),
                "body_fat_navy": round(body_fat_navy, 1) if body_fat_navy else None,
                "ideal_weight": ideal_weight,
                "calorie_needs": calorie_needs,
                "health_status": health_metrics.health_status,
                "recommendations": recommendations
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating health metrics: {str(e)}")

@api_router.get("/health-metrics/history")
async def get_health_metrics_history(current_user: User = Depends(get_current_user)):
    """Get user's health metrics history"""
    try:
        metrics = await db.health_metrics.find(
            {"user_id": current_user.id}
        ).sort("calculated_at", -1).to_list(50)
        
        return {
            "metrics": metrics,
            "total_records": len(metrics)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving health metrics: {str(e)}")

@api_router.post("/body-measurements")
async def add_body_measurements(
    measurements: BodyMeasurements,
    current_user: User = Depends(get_current_user)
):
    """Add body measurements"""
    measurements.user_id = current_user.id
    await db.body_measurements.insert_one(measurements.dict())
    return {"message": "Medidas corporales guardadas exitosamente"}

@api_router.get("/body-measurements")
async def get_body_measurements(current_user: User = Depends(get_current_user)):
    """Get user's body measurements history"""
    measurements = await db.body_measurements.find(
        {"user_id": current_user.id}
    ).sort("date", -1).to_list(100)
    
    return {
        "measurements": measurements,
        "total_records": len(measurements)
    }

@api_router.get("/health-analysis")
async def get_health_analysis(current_user: User = Depends(get_current_user)):
    """Get comprehensive health analysis"""
    try:
        # Get latest health metrics
        latest_metrics = await db.health_metrics.find_one(
            {"user_id": current_user.id},
            sort=[("calculated_at", -1)]
        )
        
        # Get recent body measurements
        recent_measurements = await db.body_measurements.find(
            {"user_id": current_user.id}
        ).sort("date", -1).to_list(10)
        
        # Get progress entries for weight tracking
        progress_entries = await db.progress.find(
            {"user_id": current_user.id}
        ).sort("date", -1).to_list(30)
        
        # Calculate trends if we have data
        weight_trend = None
        if len(progress_entries) >= 2:
            recent_weights = [entry.get("weight") for entry in progress_entries[:10] if entry.get("weight")]
            if len(recent_weights) >= 2:
                weight_change = recent_weights[0] - recent_weights[-1]
                weight_trend = {
                    "change": round(weight_change, 1),
                    "direction": "increase" if weight_change > 0 else "decrease" if weight_change < 0 else "stable",
                    "period_days": (progress_entries[0]["date"] - progress_entries[len(recent_weights)-1]["date"]).days
                }
        
        return {
            "latest_metrics": latest_metrics,
            "recent_measurements": recent_measurements[:5],  # Last 5 measurements
            "progress_summary": {
                "weight_trend": weight_trend,
                "total_progress_entries": len(progress_entries)
            },
            "health_score": {
                "bmi_score": 100 if latest_metrics and 18.5 <= latest_metrics.get("bmi", 0) <= 24.9 else 70,
                "activity_score": 85,  # This could be calculated based on workout completion
                "nutrition_score": 80,  # This could be calculated based on meal plan adherence
                "overall_score": 85
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving health analysis: {str(e)}")

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