import os
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from google import genai
from google.genai import types


load_dotenv()

# ─────────────────── Config ────────────────────────────────────────────────
MONGO_URL   = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME     = os.getenv("DB_NAME", "agrismart_db")
GEMINI_KEY  = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-3.6-flash"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# ─────────────────── Database ──────────────────────────────────────────────
db_client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client, db
    try:
        print(f"Attempting to connect to MongoDB at: {MONGO_URL}")
        # Initialize AsyncIOMotorClient with a 2-second server selection timeout to avoid hangs
        db_client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
        # Execute a cheap command to test the connection
        await db_client.admin.command('ismaster')
        db = db_client[DB_NAME]
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Falling back to InMemory/JSON database.")
        from db_fallback import InMemoryMotorClient
        db_client = InMemoryMotorClient(MONGO_URL)
        db = db_client[DB_NAME]
    
    await seed_data()
    yield
    if db_client:
        db_client.close()

app = FastAPI(title="AgriSmart Connect API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    gemini_client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None
except Exception as e:
    print(f"Failed to initialize Gemini client: {e}")
    gemini_client = None


def _raise_gemini_error(exc: Exception, action: str) -> None:
    """Map Gemini/API failures to a clear HTTP error instead of crashing."""
    if isinstance(exc, HTTPException):
        raise exc

    error_msg = str(exc).strip() or type(exc).__name__
    lower = error_msg.lower()

    if any(token in lower for token in ("quota", "rate limit", "resource exhausted", "429")):
        raise HTTPException(
            status_code=429,
            detail=(
                "Gemini API quota exceeded. Check billing/balance or update "
                "GEMINI_API_KEY in the .env file."
            ),
        )
    if any(token in lower for token in ("api key", "permission", "unauthenticated", "401", "403")):
        raise HTTPException(
            status_code=401,
            detail="Gemini API authentication failed. Verify GEMINI_API_KEY in the .env file.",
        )
    if any(token in lower for token in ("not found", "404", "is not found", "invalid model name", "model does not exist")):
        raise HTTPException(
            status_code=502,
            detail=f"Gemini model '{GEMINI_MODEL}' is unavailable: {error_msg}",
        )

    raise HTTPException(status_code=502, detail=f"{action} failed: {error_msg}")


# ─────────────────────── Pydantic Models ───────────────────────────────────
class CropInput(BaseModel):
    nitrogen:    float
    phosphorus:  float
    potassium:   float
    temperature: float
    humidity:    float
    ph:          float
    rainfall:    float

class DiseaseInput(BaseModel):
    image_base64: str

class ChatInput(BaseModel):
    message:    str
    session_id: Optional[str] = None

class MarketplaceListing(BaseModel):
    title:       str
    description: str
    price:       float
    category:    str
    seller_name: str
    location:    str
    image_url:   Optional[str] = None
    is_organic:  bool = False

# ─────────────────── Crop Recommendation Logic ─────────────────────────────
CROP_PROFILES = {
    "Rice": {
        "nitrogen":    (60, 120),
        "phosphorus":  (30, 60),
        "potassium":   (30, 60),
        "temperature": (22, 32),
        "humidity":    (70, 90),
        "ph":          (5.5, 7.0),
        "rainfall":    (100, 250),
        "tips": [
            "Transplant seedlings at 2-3 weeks old for better yield.",
            "Maintain 2-5 cm water level during growth phase.",
            "Apply nitrogen fertilizer in split doses.",
            "Monitor for blast disease and apply fungicide if needed.",
            "Harvest when 80% of grains turn golden yellow.",
        ],
    },
    "Wheat": {
        "nitrogen":    (60, 100),
        "phosphorus":  (30, 60),
        "potassium":   (20, 50),
        "temperature": (12, 25),
        "humidity":    (50, 70),
        "ph":          (6.0, 7.5),
        "rainfall":    (45, 90),
        "tips": [
            "Sow seeds at 5-6 cm depth for uniform germination.",
            "Apply pre-sowing irrigation for best establishment.",
            "Use rust-resistant varieties in humid regions.",
            "Top-dress with urea at tillering stage.",
            "Harvest early morning to minimize grain shattering.",
        ],
    },
    "Maize": {
        "nitrogen":    (80, 140),
        "phosphorus":  (40, 80),
        "potassium":   (40, 80),
        "temperature": (18, 30),
        "humidity":    (50, 75),
        "ph":          (5.8, 7.0),
        "rainfall":    (50, 150),
        "tips": [
            "Maintain plant spacing of 60×20 cm.",
            "Apply furrow irrigation at tasseling and silking.",
            "Control weeds in first 4 weeks for best yield.",
            "Scout for fall armyworm regularly.",
            "Dry grain to <14% moisture before storage.",
        ],
    },
    "Cotton": {
        "nitrogen":    (40, 100),
        "phosphorus":  (20, 50),
        "potassium":   (30, 60),
        "temperature": (25, 40),
        "humidity":    (40, 70),
        "ph":          (6.0, 8.0),
        "rainfall":    (50, 120),
        "tips": [
            "Use wide row spacing (90–100 cm) for mechanized harvesting.",
            "Apply growth regulator at squaring stage.",
            "Monitor bollworm closely after flowering.",
            "Avoid waterlogging; ensure proper drainage.",
            "Harvest at full boll opening for best fibre quality.",
        ],
    },
    "Tomato": {
        "nitrogen":    (80, 120),
        "phosphorus":  (40, 80),
        "potassium":   (100, 200),
        "temperature": (18, 27),
        "humidity":    (60, 80),
        "ph":          (6.0, 7.0),
        "rainfall":    (40, 100),
        "tips": [
            "Start from nursery and transplant at 25-30 days.",
            "Stake plants to prevent lodging and disease.",
            "Use drip irrigation for water efficiency.",
            "Apply calcium spray to prevent blossom-end rot.",
            "Harvest at breaker stage for transportation.",
        ],
    },
    "Potato": {
        "nitrogen":    (80, 120),
        "phosphorus":  (40, 80),
        "potassium":   (80, 160),
        "temperature": (10, 22),
        "humidity":    (60, 80),
        "ph":          (5.5, 6.5),
        "rainfall":    (50, 100),
        "tips": [
            "Use certified seed tubers for uniform crop.",
            "Earth up plants at 30 days to prevent greening.",
            "Apply fungicide to prevent late blight.",
            "Stop irrigation 2 weeks before harvest.",
            "Cure harvested tubers at 10-15°C for 2 weeks.",
        ],
    },
    "Sugarcane": {
        "nitrogen":    (100, 200),
        "phosphorus":  (40, 80),
        "potassium":   (80, 150),
        "temperature": (24, 38),
        "humidity":    (60, 85),
        "ph":          (6.0, 8.0),
        "rainfall":    (100, 250),
        "tips": [
            "Plant setts with 2-3 budded pieces at 75 cm spacing.",
            "Apply trash mulching to conserve moisture.",
            "Use drip fertigation for nutrient efficiency.",
            "Harvest at 10-12 months for optimum sugar content.",
            "Ratoon the crop for 2-3 seasons to reduce costs.",
        ],
    },
}

WEIGHTS = {
    "nitrogen": 0.20,
    "phosphorus": 0.15,
    "potassium": 0.15,
    "temperature": 0.20,
    "humidity": 0.15,
    "ph": 0.10,
    "rainfall": 0.05,
}

def score_crop(crop_profile: dict, inp: CropInput) -> float:
    data = {
        "nitrogen":    inp.nitrogen,
        "phosphorus":  inp.phosphorus,
        "potassium":   inp.potassium,
        "temperature": inp.temperature,
        "humidity":    inp.humidity,
        "ph":           inp.ph,
        "rainfall":    inp.rainfall,
    }
    total_score = 0.0
    for param, weight in WEIGHTS.items():
        lo, hi = crop_profile[param]
        val = data[param]
        mid = (lo + hi) / 2
        span = (hi - lo) / 2 or 1
        distance = abs(val - mid) / span
        param_score = max(0.0, 1.0 - distance)
        total_score += param_score * weight
    return round(total_score * 100, 2)

# ─────────────────── Seed Data ─────────────────────────────────────────────
async def seed_data():
    # Marketplace
    if await db["marketplace"].count_documents({}) == 0:
        listings = [
            {"id": str(uuid.uuid4()), "title": "Organic Wheat Seeds - Premium Quality", "description": "High-yield organic wheat seeds, certified and tested for disease resistance.", "price": 850.0, "category": "Seeds", "seller_name": "Green Valley Farms", "location": "Punjab, India", "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80", "is_organic": True, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "NPK 19-19-19 Fertilizer 50kg", "description": "Balanced NPK fertilizer for all crops. Water-soluble formula for quick absorption.", "price": 1200.0, "category": "Fertilizers", "seller_name": "AgriChem Solutions", "location": "Haryana, India", "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80", "is_organic": False, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Hybrid Tomato Seeds F1 (100g)", "description": "Disease-resistant F1 hybrid tomato seeds. High yield potential of 60-80 tons/ha.", "price": 450.0, "category": "Seeds", "seller_name": "SeedTech India", "location": "Karnataka, India", "image_url": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&q=80", "is_organic": False, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Stainless Steel Garden Tool Set (5pc)", "description": "Ergonomic hand tool set including trowel, cultivator, fork, weeder, and transplanter.", "price": 799.0, "category": "Tools", "seller_name": "FarmTools Co.", "location": "Gujarat, India", "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80", "is_organic": False, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Organic Vermicompost 25kg", "description": "Rich organic vermicompost packed with beneficial microorganisms. Improves soil structure.", "price": 350.0, "category": "Fertilizers", "seller_name": "EcoFarm Organics", "location": "Maharashtra, India", "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80", "is_organic": True, "created_at": datetime.now(timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Fresh Alphonso Mangoes (12kg Box)", "description": "Premium Alphonso mangoes directly from the orchard. Naturally ripened, no chemicals.", "price": 1500.0, "category": "Produce", "seller_name": "Ratnagiri Farms", "location": "Maharashtra, India", "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80", "is_organic": True, "created_at": datetime.now(timezone.utc)},
        ]
        await db["marketplace"].insert_many(listings)

    # News
    if await db["news"].count_documents({}) == 0:
        articles = [
            {"id": str(uuid.uuid4()), "title": "AI-Powered Crop Disease Detection Achieves 95% Accuracy", "category": "Technology", "content": "A new AI system developed by researchers can detect over 50 plant diseases with 95% accuracy, potentially saving billions in crop losses annually. The system uses advanced computer vision models trained on over 2 million leaf images.\n\nFarmers can now use smartphone apps integrated with this technology to get instant diagnoses in the field, reducing dependence on expert consultants. Early detection means diseases can be treated before they spread.\n\nThe technology is expected to be available as a commercial product by Q3 this year.", "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80", "published_at": datetime(2026, 4, 14, tzinfo=timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Wheat Prices Hit 3-Year High Amid Global Supply Concerns", "category": "Market Prices", "content": "Wheat futures surged 12% this month as adverse weather conditions in major producing regions raised supply concerns. India's wheat crop output is estimated at 108 million tonnes, slightly below last year's record.\n\nExperts advise farmers to consider forward contracts to lock in current favorable prices. The government has also raised the Minimum Support Price (MSP) for wheat by ₹150 per quintal.\n\nSmall-scale farmers are encouraged to use cooperatives and FPOs to negotiate better prices in wholesale markets.", "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80", "published_at": datetime(2026, 4, 12, tzinfo=timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "PM Kisan Scheme: ₹2000 Installment Released for 9 Crore Farmers", "category": "Government Schemes", "content": "The Ministry of Agriculture confirmed the release of the next PM-KISAN installment, providing direct cash benefit of ₹2000 to over 9 crore registered farmers across India.\n\nEligible farmers who haven't registered yet can do so at their nearest Common Service Centre (CSC) or online at pmkisan.gov.in. The scheme provides ₹6000 per year in three installments.\n\nAdditionally, the government announced a new ₹1.5 lakh crore agriculture credit scheme with reduced interest rates for small and marginal farmers.", "image_url": "https://images.unsplash.com/photo-1589923188651-268a9765e432?w=600&q=80", "published_at": datetime(2026, 4, 10, tzinfo=timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Organic Farming Area in India Grows by 30% in 2026", "category": "Trends", "content": "India's organic farming area has grown by 30% from last year, reaching over 4.5 million hectares. Sikkim remains 100% organic, and Maharashtra leads in the number of certified organic farmers.\n\nConsumer demand for organic produce has driven premium prices 40-60% higher than conventional produce. Government subsidies for organic certification are also making the transition more affordable.\n\nExperts recommend farmers start with high-value crops like vegetables, spices, and pulses when transitioning to organic methods.", "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80", "published_at": datetime(2026, 4, 8, tzinfo=timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Drone-Based Pesticide Spraying Reduces Chemical Use by 40%", "category": "Technology", "content": "Agricultural drones equipped with precision nozzles are helping farmers reduce pesticide use by up to 40% while improving coverage uniformity. The technology is particularly effective for large fields of cotton, sugarcane, and paddy.\n\nThe government's Drone Didi scheme is training rural women as certified drone pilots, creating new income opportunities. Over 1000 women have been trained so far.\n\nDrones can cover 10 acres in an hour versus 2 acres for manual spraying, significantly reducing labor costs during peak periods.", "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80", "published_at": datetime(2026, 4, 5, tzinfo=timezone.utc)},
            {"id": str(uuid.uuid4()), "title": "Climate-Smart Agriculture: Adapting to Changing Monsoon Patterns", "category": "Trends", "content": "As monsoon patterns become increasingly unpredictable, agricultural scientists are developing climate-smart crop varieties and farming practices. New drought-tolerant rice varieties can withstand 2-week dry spells during the growing season.\n\nSoil moisture sensors and IoT devices are helping farmers optimize irrigation timing, reducing water use by up to 30%. These technologies are now becoming affordable for small farmers through government subsidy programs.\n\nFarmers are also being trained in Conservation Agriculture (CA) practices like minimum tillage and crop residue management to build soil health and resilience.", "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80", "published_at": datetime(2026, 4, 2, tzinfo=timezone.utc)},
        ]
        await db["news"].insert_many(articles)

# ─────────────────── Routes ────────────────────────────────────────────────
@app.get("/api/")
async def root():
    return {"message": "AgriSmart Connect API", "version": "1.0.0"}

@app.post("/api/crop-recommendation")
async def crop_recommendation(inp: CropInput):
    results = []
    for crop_name, profile in CROP_PROFILES.items():
        score = score_crop(profile, inp)
        results.append({
            "id": str(uuid.uuid4()),
            "crop_name": crop_name,
            "suitability_score": score,
            "confidence": round(score / 100, 2),
            "reason": f"Your soil and climate conditions are {score}% suitable for {crop_name} cultivation.",
            "growing_tips": profile["tips"],
        })
    results.sort(key=lambda x: x["suitability_score"], reverse=True)
    top3 = results[:3]

    doc = {
        "input_data": inp.model_dump(),
        "recommendations": top3,
        "timestamp": datetime.now(timezone.utc),
    }
    await db["crop_recommendations"].insert_one(doc)

    return {"recommendations": top3, "timestamp": datetime.now(timezone.utc).isoformat()}

class DiseaseDiagnosisOutput(BaseModel):
    disease: str = Field(description="Name of the disease or 'Unable to identify' if not a plant leaf")
    confidence: float = Field(description="Confidence percentage from 0 to 100")
    symptoms: List[str] = Field(description="List of symptoms identified")
    description: str = Field(description="Detailed description of the disease")
    treatment: List[str] = Field(description="List of treatment measures")
    prevention: List[str] = Field(description="List of prevention tips")

@app.post("/api/disease-diagnosis")
async def disease_diagnosis(inp: DiseaseInput):
    if not gemini_client:
        raise HTTPException(
            status_code=503,
            detail="Gemini API is not configured. Set GEMINI_API_KEY in the .env file.",
        )

    try:
        image_data = inp.image_base64
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(image_data, validate=True)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid image data. Please upload a valid base64-encoded image.",
            )

        if not image_bytes:
            raise HTTPException(status_code=400, detail="Image data is empty.")

        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg"
        )

        response = await gemini_client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                "Analyze this crop leaf image for diseases and provide a structured diagnosis.",
                image_part
            ],
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an AI system specialized in plant disease detection and agricultural advisory. "
                    "Analyze crop leaf images and return a structured JSON response. "
                    "If the image is not a plant/leaf, set disease to 'Unable to identify - please upload a clear leaf image'."
                ),
                response_mime_type="application/json",
                response_schema=DiseaseDiagnosisOutput,
            )
        )

        data = response.parsed
        if not data:
            raise HTTPException(
                status_code=502,
                detail="Disease analysis failed: Gemini returned an empty or unparsable response.",
            )

        result = {
            "id": str(uuid.uuid4()),
            "disease_name": getattr(data, "disease", "Unknown"),
            "confidence": getattr(data, "confidence", 0.0) / 100,
            "description": getattr(data, "description", ""),
            "symptoms": getattr(data, "symptoms", []),
            "treatment": getattr(data, "treatment", []),
            "prevention_tips": getattr(data, "prevention", []),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        await db["disease_analyses"].insert_one({**result})
        return result

    except Exception as e:
        _raise_gemini_error(e, "Disease analysis")

@app.post("/api/chat")
async def chat(inp: ChatInput):
    if not gemini_client:
        raise HTTPException(
            status_code=503,
            detail="Gemini API is not configured. Set GEMINI_API_KEY in the .env file.",
        )

    session_id = inp.session_id or str(uuid.uuid4())

    try:
        # Retrieve recent history
        history_cursor = db["chat_messages"].find(
            {"session_id": session_id},
            sort=[("timestamp", -1)],
            limit=10,
        )
        history = await history_cursor.to_list(length=10)
        history.reverse()

        contents = []
        for h in history:
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=h["user_message"])]
                )
            )
            contents.append(
                types.Content(
                    role="model",
                    parts=[types.Part.from_text(text=h["ai_response"])]
                )
            )

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=inp.message)]
            )
        )

        response = await gemini_client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are AgriSmart Assistant, an AI expert in agriculture, farming practices, and rural development. "
                    "Provide practical, accurate advice on crop cultivation, pest control, soil health, weather-based farming, "
                    "market prices, government agricultural schemes, sustainable farming, irrigation, and harvest management. "
                    "Be concise, friendly, and use simple language suitable for farmers. Provide actionable advice."
                ),
                max_output_tokens=600,
            )
        )
        ai_text = (response.text or "").strip()
        if not ai_text:
            raise HTTPException(
                status_code=502,
                detail="Chat failed: Gemini returned an empty response.",
            )

        doc = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_message": inp.message,
            "ai_response": ai_text,
            "timestamp": datetime.now(timezone.utc),
        }
        await db["chat_messages"].insert_one(doc)

        return {"response": ai_text, "session_id": session_id, "timestamp": datetime.now(timezone.utc).isoformat()}

    except Exception as e:
        _raise_gemini_error(e, "Chat")

@app.get("/api/marketplace")
async def get_marketplace(category: Optional[str] = Query(None)):
    query = {}
    if category and category != "All":
        query["category"] = category
    cursor = db["marketplace"].find(query, {"_id": 0}).sort("created_at", -1)
    listings = await cursor.to_list(length=100)
    return listings

@app.post("/api/marketplace", status_code=201)
async def create_listing(listing: MarketplaceListing):
    doc = {
        "id": str(uuid.uuid4()),
        **listing.model_dump(),
        "created_at": datetime.now(timezone.utc),
    }
    await db["marketplace"].insert_one(doc)
    doc.pop("_id", None)
    return doc

@app.get("/api/news")
async def get_news(category: Optional[str] = Query(None)):
    query = {}
    if category and category != "All":
        query["category"] = category
    cursor = db["news"].find(query, {"_id": 0}).sort("published_at", -1)
    articles = await cursor.to_list(length=100)
    return articles
