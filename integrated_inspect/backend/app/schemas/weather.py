from pydantic import BaseModel
class Location(BaseModel):
    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str | None = None
    admin1: str | None = None
class CurrentWeather(BaseModel):
    location: Location
    time: str | None = None
    temperature: float
    feels_like: float
    humidity: float
    wind_speed: float
    wind_direction: float
    rain_probability: float | None = None
    precipitation: float
    pressure: float
    cloud_cover: float
    visibility: float | None = None
    weather_code: int
    condition: str
    is_day: int | None = None
    source: str = "Open-Meteo"
