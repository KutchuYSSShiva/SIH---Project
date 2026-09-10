# Test requests

## Current weather
GET http://127.0.0.1:8000/api/weather/current?latitude=17.6868&longitude=83.2185

## City weather
GET http://127.0.0.1:8000/api/weather/by-city?city=Visakhapatnam

## Forecast
GET http://127.0.0.1:8000/api/weather/forecast?latitude=17.6868&longitude=83.2185&days=7

## Chat
POST http://127.0.0.1:8000/api/chat
Content-Type: application/json

{
  "message": "Will it rain heavily in Visakhapatnam tomorrow?",
  "conversation": [],
  "language": "en",
  "latitude": 17.6868,
  "longitude": 83.2185,
  "location_name": "Visakhapatnam"
}
