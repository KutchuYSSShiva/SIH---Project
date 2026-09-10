import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.weather import router as weather_router
from app.api.chat import router as chat_router

app = FastAPI(title="WeatherGPT Backend", version="2.0.0")
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(weather_router, prefix="/api/weather", tags=["weather"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root(): return {"name":"WeatherGPT","status":"online","version":"2.0.0","docs":"/docs"}
@app.get("/health")
async def health(): return {"status":"ok","version":"2.0.0"}
