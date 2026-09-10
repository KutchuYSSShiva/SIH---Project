from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from app.services.weather_service import geocode_city, reverse_geocode, get_forecast, pick_current, condition, hourly_items, daily_items, current_hour_probability
from app.schemas.weather import CurrentWeather

router = APIRouter()

@router.get("/reverse")
async def reverse_location(latitude: float = Query(..., ge=-90, le=90), longitude: float = Query(..., ge=-180, le=180)):
    try:
        return await reverse_geocode(latitude, longitude)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Location lookup error: {exc}")

@router.get("/current", response_model=CurrentWeather)
async def current_weather(latitude: float = Query(..., ge=-90, le=90), longitude: float = Query(..., ge=-180, le=180)):
    try:
        raw = await get_forecast(latitude, longitude, 1)
        current = pick_current(raw)
        current["rain_probability"] = current_hour_probability(raw)
        return {"location":{"name":"Selected location","country":"IN","latitude":latitude,"longitude":longitude,"timezone":raw.get("timezone")}, **current, "source":"Open-Meteo"}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather provider error: {exc}")

@router.get("/by-city")
async def weather_by_city(city: str = Query(..., min_length=2)):
    try:
        loc = await geocode_city(city)
        raw = await get_forecast(loc["latitude"], loc["longitude"], 7)
        current = pick_current(raw)
        current["rain_probability"] = current_hour_probability(raw)
        return {"location":{"name":loc["name"],"country":loc.get("country_code","IN"),"latitude":loc["latitude"],"longitude":loc["longitude"],"timezone":loc.get("timezone"),"admin1":loc.get("admin1"),"admin2":loc.get("admin2")},"current":current,"hourly":hourly_items(raw),"daily":daily_items(raw),"source":"Open-Meteo forecast model","source_type":"open_meteo","fetchedAt":datetime.now(timezone.utc).isoformat(),"satellite":{"provider":"MOSDAC / SAC / ISRO","live_url":"https://mosdac.gov.in/live/","embed_url":"https://mosdac.gov.in/live/"},"imd":{"api_url":"https://api.imd.gov.in/","warnings_url":"https://mausam.imd.gov.in/"}}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather provider error: {exc}")

@router.get("/forecast")
async def forecast(latitude: float, longitude: float, days: int = Query(7, ge=1, le=16)):
    try:
        raw=await get_forecast(latitude,longitude,days)
        return {"source":"Open-Meteo forecast model","source_type":"open_meteo","timezone":raw.get("timezone"),"fetchedAt":datetime.now(timezone.utc).isoformat(),"current":{**pick_current(raw),"rain_probability":current_hour_probability(raw)},"hourly":hourly_items(raw),"daily":daily_items(raw),"satellite":{"provider":"MOSDAC / SAC / ISRO","live_url":"https://mosdac.gov.in/live/","embed_url":"https://mosdac.gov.in/live/"},"imd":{"api_url":"https://api.imd.gov.in/","warnings_url":"https://mausam.imd.gov.in/"}}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Forecast provider error: {exc}")

@router.get("/sources")
async def sources():
    return {
        "forecast":"https://open-meteo.com/",
        "satellite":{"provider":"MOSDAC / SAC / ISRO","live":"https://mosdac.gov.in/live/"},
        "imd":{"api":"https://api.imd.gov.in/","warnings":"https://mausam.imd.gov.in/"},
        "safety":"https://sachet.ndma.gov.in/DosDont",
    }
