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
    tips: List[str] = []
    shopping_list: List[str] = []
    plan_name: str = "Plan Nutricional Personalizado"

class ShoppingList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan_id: str
    items: List[Dict[str, Any]]  # [{name, quantity, category, purchased}]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = False

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