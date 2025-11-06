from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    target_calories: int = 2000
    target_protein: int = 150
    target_carbs: int = 200
    target_fats: int = 65
    goal: str = "maintain"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProfileCreate(BaseModel):
    name: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    target_calories: int = 2000
    target_protein: int = 150
    target_carbs: int = 200
    target_fats: int = 65
    goal: str = "maintain"

class Workout(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workout_type: str
    duration: int  # in minutes
    calories_burned: int
    intensity: str = "moderate"
    notes: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkoutCreate(BaseModel):
    workout_type: str
    duration: int
    calories_burned: int
    intensity: str = "moderate"
    notes: Optional[str] = None
    date: Optional[datetime] = None

class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    rest_seconds: int = 60

class WorkoutPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    difficulty: str
    duration: int  # total minutes
    exercises: List[Exercise]
    category: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkoutPlanCreate(BaseModel):
    name: str
    description: str
    difficulty: str
    duration: int
    exercises: List[Exercise]
    category: str

class NutritionLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    meal_name: str
    meal_type: str  # breakfast, lunch, dinner, snack
    calories: int
    protein: int
    carbs: int
    fats: int
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NutritionLogCreate(BaseModel):
    meal_name: str
    meal_type: str
    calories: int
    protein: int
    carbs: int
    fats: int
    date: Optional[datetime] = None

class DashboardStats(BaseModel):
    total_workouts_today: int
    calories_burned_today: int
    calories_consumed_today: int
    protein_consumed_today: int
    carbs_consumed_today: int
    fats_consumed_today: int
    workout_streak: int
    target_calories: int
    target_protein: int
    target_carbs: int
    target_fats: int

# User Profile Routes
@api_router.post("/profile", response_model=UserProfile)
async def create_profile(input: UserProfileCreate):
    profile_dict = input.model_dump()
    profile_obj = UserProfile(**profile_dict)

    doc = profile_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.user_profiles.insert_one(doc)
    return profile_obj

@api_router.get("/profile", response_model=UserProfile)
async def get_profile():
    profile = await db.user_profiles.find_one({}, {"_id": 0}, sort=[("created_at", -1)])

    if not profile:
        # Return default profile
        default_profile = UserProfile(
            name="User",
            target_calories=2000,
            target_protein=150,
            target_carbs=200,
            target_fats=65,
            goal="maintain"
        )
        return default_profile

    if isinstance(profile['created_at'], str):
        profile['created_at'] = datetime.fromisoformat(profile['created_at'])

    return profile

@api_router.put("/profile/{profile_id}", response_model=UserProfile)
async def update_profile(profile_id: str, input: UserProfileCreate):
    profile_dict = input.model_dump()

    result = await db.user_profiles.update_one(
        {"id": profile_id},
        {"$set": profile_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")

    updated_profile = await db.user_profiles.find_one({"id": profile_id}, {"_id": 0})
    if isinstance(updated_profile['created_at'], str):
        updated_profile['created_at'] = datetime.fromisoformat(updated_profile['created_at'])

    return updated_profile

# Workout Routes
@api_router.post("/workouts", response_model=Workout)
async def create_workout(input: WorkoutCreate):
    workout_dict = input.model_dump()
    if workout_dict['date'] is None:
        workout_dict['date'] = datetime.now(timezone.utc)
    workout_obj = Workout(**workout_dict)

    doc = workout_obj.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.workouts.insert_one(doc)
    return workout_obj

@api_router.get("/workouts", response_model=List[Workout])
async def get_workouts(limit: int = 50):
    workouts = await db.workouts.find({}, {"_id": 0}).sort("date", -1).to_list(limit)

    for workout in workouts:
        if isinstance(workout['date'], str):
            workout['date'] = datetime.fromisoformat(workout['date'])
        if isinstance(workout['created_at'], str):
            workout['created_at'] = datetime.fromisoformat(workout['created_at'])

    return workouts

@api_router.get("/workouts/today", response_model=List[Workout])
async def get_today_workouts():
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    workouts = await db.workouts.find({}, {"_id": 0}).to_list(1000)

    today_workouts = []
    for workout in workouts:
        if isinstance(workout['date'], str):
            workout['date'] = datetime.fromisoformat(workout['date'])
        if isinstance(workout['created_at'], str):
            workout['created_at'] = datetime.fromisoformat(workout['created_at'])

        if today_start <= workout['date'] < today_end:
            today_workouts.append(workout)

    return today_workouts

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str):
    result = await db.workouts.delete_one({"id": workout_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"message": "Workout deleted successfully"}

# Workout Plans Routes
@api_router.post("/workout-plans", response_model=WorkoutPlan)
async def create_workout_plan(input: WorkoutPlanCreate):
    plan_dict = input.model_dump()
    plan_obj = WorkoutPlan(**plan_dict)

    doc = plan_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.workout_plans.insert_one(doc)
    return plan_obj

@api_router.get("/workout-plans", response_model=List[WorkoutPlan])
async def get_workout_plans():
    plans = await db.workout_plans.find({}, {"_id": 0}).to_list(1000)

    for plan in plans:
        if isinstance(plan['created_at'], str):
            plan['created_at'] = datetime.fromisoformat(plan['created_at'])

    return plans

@api_router.get("/workout-plans/{plan_id}", response_model=WorkoutPlan)
async def get_workout_plan(plan_id: str):
    plan = await db.workout_plans.find_one({"id": plan_id}, {"_id": 0})

    if not plan:
        raise HTTPException(status_code=404, detail="Workout plan not found")

    if isinstance(plan['created_at'], str):
        plan['created_at'] = datetime.fromisoformat(plan['created_at'])

    return plan

# Nutrition Routes
@api_router.post("/nutrition", response_model=NutritionLog)
async def create_nutrition_log(input: NutritionLogCreate):
    nutrition_dict = input.model_dump()
    if nutrition_dict['date'] is None:
        nutrition_dict['date'] = datetime.now(timezone.utc)
    nutrition_obj = NutritionLog(**nutrition_dict)

    doc = nutrition_obj.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.nutrition_logs.insert_one(doc)
    return nutrition_obj

@api_router.get("/nutrition", response_model=List[NutritionLog])
async def get_nutrition_logs(limit: int = 50):
    logs = await db.nutrition_logs.find({}, {"_id": 0}).sort("date", -1).to_list(limit)

    for log in logs:
        if isinstance(log['date'], str):
            log['date'] = datetime.fromisoformat(log['date'])
        if isinstance(log['created_at'], str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])

    return logs

@api_router.get("/nutrition/today", response_model=List[NutritionLog])
async def get_today_nutrition():
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    logs = await db.nutrition_logs.find({}, {"_id": 0}).to_list(1000)

    today_logs = []
    for log in logs:
        if isinstance(log['date'], str):
            log['date'] = datetime.fromisoformat(log['date'])
        if isinstance(log['created_at'], str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])

        if today_start <= log['date'] < today_end:
            today_logs.append(log)

    return today_logs

@api_router.delete("/nutrition/{log_id}")
async def delete_nutrition_log(log_id: str):
    result = await db.nutrition_logs.delete_one({"id": log_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    return {"message": "Nutrition log deleted successfully"}

# Dashboard Stats Route
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # Get profile
    profile = await db.user_profiles.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not profile:
        profile = {
            "target_calories": 2000,
            "target_protein": 150,
            "target_carbs": 200,
            "target_fats": 65
        }

    # Get today's workouts
    workouts = await db.workouts.find({}, {"_id": 0}).to_list(1000)
    today_workouts = []
    for workout in workouts:
        if isinstance(workout['date'], str):
            workout['date'] = datetime.fromisoformat(workout['date'])
        if today_start <= workout['date'] < today_end:
            today_workouts.append(workout)

    # Get today's nutrition
    nutrition_logs = await db.nutrition_logs.find({}, {"_id": 0}).to_list(1000)
    today_nutrition = []
    for log in nutrition_logs:
        if isinstance(log['date'], str):
            log['date'] = datetime.fromisoformat(log['date'])
        if today_start <= log['date'] < today_end:
            today_nutrition.append(log)

    # Calculate totals
    total_workouts_today = len(today_workouts)
    calories_burned_today = sum(w['calories_burned'] for w in today_workouts)
    calories_consumed_today = sum(n['calories'] for n in today_nutrition)
    protein_consumed_today = sum(n['protein'] for n in today_nutrition)
    carbs_consumed_today = sum(n['carbs'] for n in today_nutrition)
    fats_consumed_today = sum(n['fats'] for n in today_nutrition)

    # Calculate workout streak
    all_workouts = await db.workouts.find({}, {"_id": 0}).sort("date", -1).to_list(1000)
    workout_dates = set()
    for workout in all_workouts:
        if isinstance(workout['date'], str):
            workout['date'] = datetime.fromisoformat(workout['date'])
        workout_dates.add(workout['date'].date())

    streak = 0
    current_date = datetime.now(timezone.utc).date()
    while current_date in workout_dates:
        streak += 1
        current_date = current_date - timedelta(days=1)

    return DashboardStats(
        total_workouts_today=total_workouts_today,
        calories_burned_today=calories_burned_today,
        calories_consumed_today=calories_consumed_today,
        protein_consumed_today=protein_consumed_today,
        carbs_consumed_today=carbs_consumed_today,
        fats_consumed_today=fats_consumed_today,
        workout_streak=streak,
        target_calories=profile['target_calories'],
        target_protein=profile['target_protein'],
        target_carbs=profile['target_carbs'],
        target_fats=profile['target_fats']
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()