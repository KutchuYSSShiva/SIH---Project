import httpx
from datetime import datetime
from zoneinfo import ZoneInfo

BASE_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
REVERSE_GEOCODE_URL = "https://nominatim.openstreetmap.org/reverse"

WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain", 66: "Light freezing rain",
    67: "Heavy freezing rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers",
    82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "te": "Telugu", "ta": "Tamil",
    "kn": "Kannada", "ml": "Malayalam", "mr": "Marathi", "bn": "Bengali",
    "gu": "Gujarati", "pa": "Punjabi", "ur": "Urdu",
}

CITY_ALIASES = {
    "bangalore": "Bengaluru",
    "bombay": "Mumbai",
    "calcutta": "Kolkata",
    "madras": "Chennai",
    "poona": "Pune",
    "cochin": "Kochi",
    "trivandrum": "Thiruvananthapuram",
    "banaras": "Varanasi",
    "benares": "Varanasi",
    "kashi": "Varanasi",
    "gurgaon": "Gurugram",
    "pondicherry": "Puducherry",
    "orissa": "Odisha",
    "baroda": "Vadodara",
    "calicut": "Kozhikode",
    "vizag": "Visakhapatnam",
    "waltair": "Visakhapatnam",
    "trichy": "Tiruchirappalli",
    "allahabad": "Prayagraj",
}

async def geocode_city(name: str, language: str = "en") -> dict:
    cleaned = name.strip()
    lookup_name = CITY_ALIASES.get(cleaned.casefold(), cleaned)
    params = {
        "name": lookup_name, "count": 10, "language": language if language in LANGUAGE_NAMES else "en",
        "format": "json", "countryCode": "IN",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(GEOCODE_URL, params=params)
        r.raise_for_status()
        results = (r.json() or {}).get("results") or []
        if not results:
            # Fallback without countryCode
            params.pop("countryCode", None)
            r = await client.get(GEOCODE_URL, params=params)
            r.raise_for_status()
            results = (r.json() or {}).get("results") or []
    if not results:
        raise ValueError(f"Location not found: {name}")
    # Prefer exact name match and higher population
    lowered = lookup_name.casefold()
    results.sort(key=lambda x: (x.get("name", "").casefold() != lowered, -float(x.get("population", 0) or 0)))
    return results[0]


async def reverse_geocode(latitude: float, longitude: float) -> dict:
    async with httpx.AsyncClient(timeout=10, headers={"User-Agent": "WeatherGPT/2.1 location resolver"}) as client:
        r = await client.get(REVERSE_GEOCODE_URL, params={"lat": latitude, "lon": longitude, "format": "jsonv2", "zoom": 10, "addressdetails": 1})
        r.raise_for_status()
        data = r.json()
    address = data.get("address") or {}
    return {
        "name": address.get("city") or address.get("town") or address.get("village") or address.get("municipality") or "Current location",
        "country": address.get("country") or "India", "country_code": (address.get("country_code") or "in").upper(),
        "admin1": address.get("state"), "admin2": address.get("state_district") or address.get("district"),
        "postcode": address.get("postcode"), "road": address.get("road"), "latitude": latitude, "longitude": longitude,
        "timezone": "auto", "address": data.get("display_name"),
    }

async def get_forecast(latitude: float, longitude: float, forecast_days: int = 7, timezone: str = "auto") -> dict:
    hourly = ",".join([
        "temperature_2m", "apparent_temperature", "relative_humidity_2m",
        "precipitation_probability", "precipitation", "weather_code",
        "cloud_cover", "pressure_msl", "visibility", "wind_speed_10m", "wind_direction_10m",
        "uv_index", "is_day",
    ])
    daily = ",".join([
        "weather_code", "temperature_2m_max", "temperature_2m_min",
        "apparent_temperature_max", "apparent_temperature_min",
        "precipitation_probability_max", "precipitation_sum", "wind_speed_10m_max",
        "wind_gusts_10m_max", "sunrise", "sunset", "uv_index_max",
    ])
    params = {
        "latitude": latitude, "longitude": longitude,
        "hourly": hourly, "daily": daily,
        "current": ",".join([
            "temperature_2m", "apparent_temperature", "relative_humidity_2m",
            "precipitation", "weather_code", "cloud_cover", "pressure_msl",
            "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility", "dew_point_2m", "is_day",
        ]),
        "forecast_days": forecast_days, "timezone": timezone,
        "temperature_unit": "celsius", "wind_speed_unit": "kmh", "precipitation_unit": "mm",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(BASE_URL, params=params)
        r.raise_for_status()
        return r.json()

def condition(code: int) -> str:
    return WEATHER_CODES.get(int(code), "Unknown conditions")

def pick_current(raw: dict) -> dict:
    # Use Open-Meteo's explicit `current` object. The previous implementation
    # used hourly[0], which can represent midnight rather than the actual current hour.
    c = raw.get("current")
    if c:
        return {
            "time": c.get("time"),
            "temperature": c.get("temperature_2m"),
            "feels_like": c.get("apparent_temperature"),
            "humidity": c.get("relative_humidity_2m"),
            "wind_speed": c.get("wind_speed_10m"),
            "wind_gusts": c.get("wind_gusts_10m"),
            "wind_direction": c.get("wind_direction_10m"),
            "rain_probability": None,
            "precipitation": c.get("precipitation"),
            "pressure": c.get("pressure_msl"),
            "cloud_cover": c.get("cloud_cover"),
            "visibility": (c.get("visibility") / 1000 if c.get("visibility") is not None else None),
            "dew_point": c.get("dew_point_2m"),
            "weather_code": c.get("weather_code"),
            "condition": condition(c.get("weather_code", -1)),
            "is_day": c.get("is_day"),
        }
    h = raw["hourly"]
    i = min(range(len(h["time"])), key=lambda j: h["time"][j])
    return {
        "time": h["time"][i], "temperature": h["temperature_2m"][i],
        "feels_like": h["apparent_temperature"][i], "humidity": h["relative_humidity_2m"][i],
        "wind_speed": h["wind_speed_10m"][i], "wind_gusts": h.get("wind_gusts_10m", [None] * len(h["time"]))[i], "wind_direction": h["wind_direction_10m"][i],
        "rain_probability": h["precipitation_probability"][i],
        "precipitation": h["precipitation"][i], "pressure": h["pressure_msl"][i],
        "cloud_cover": h["cloud_cover"][i], "visibility": round(h["visibility"][i]/1000,1),
        "weather_code": h["weather_code"][i], "condition": condition(h["weather_code"][i]),
        "is_day": None,
    }

def current_hour_probability(raw: dict) -> float:
    h = raw["hourly"]
    current_time = raw.get("current", {}).get("time")
    if current_time in h["time"]:
        return h["precipitation_probability"][h["time"].index(current_time)]
    # nearest hour
    idx = min(range(len(h["time"])), key=lambda i: abs(
        datetime.fromisoformat(h["time"][i]) - datetime.fromisoformat(current_time)
    )) if current_time else 0
    return h["precipitation_probability"][idx]

def hourly_items(raw: dict) -> list[dict]:
    h = raw["hourly"]
    out = []
    for i in range(len(h["time"])):
        out.append({
            "time": h["time"][i], "temperature": h["temperature_2m"][i],
            "feels_like": h["apparent_temperature"][i], "humidity": h["relative_humidity_2m"][i],
            "rain_probability": h["precipitation_probability"][i],
            "precipitation": h["precipitation"][i], "wind_speed": h["wind_speed_10m"][i],
            "wind_direction": h["wind_direction_10m"][i], "wind_gusts": h.get("wind_gusts_10m", [None] * len(h["time"]))[i],
            "humidity": h["relative_humidity_2m"][i], "cloud_cover": h["cloud_cover"][i],
            "pressure": h["pressure_msl"][i], "visibility": (h["visibility"][i] / 1000 if h.get("visibility") else None),
            "uv_index": h["uv_index"][i], "is_day": h["is_day"][i],
            "weather_code": h["weather_code"][i], "condition": condition(h["weather_code"][i]),
        })
    return out

def daily_items(raw: dict) -> list[dict]:
    d = raw["daily"]
    return [{
        "date": d["time"][i], "max_temperature": d["temperature_2m_max"][i],
        "min_temperature": d["temperature_2m_min"][i],
        "apparent_max_temperature": d["apparent_temperature_max"][i],
        "apparent_min_temperature": d["apparent_temperature_min"][i],
        "rain_probability": d["precipitation_probability_max"][i],
        "precipitation_sum": d["precipitation_sum"][i],
        "wind_speed_max": d["wind_speed_10m_max"][i],
        "wind_gusts_max": d["wind_gusts_10m_max"][i],
        "sunrise": d["sunrise"][i], "sunset": d["sunset"][i],
        "uv_index_max": d["uv_index_max"][i],
        "weather_code": d["weather_code"][i], "condition": condition(d["weather_code"][i]),
    } for i in range(len(d["time"]))]
