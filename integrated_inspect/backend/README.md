# WeatherGPT Backend v2

This backend is designed to be the single source of weather telemetry for the React dashboard.

## Important accuracy fixes

- Current conditions use Open-Meteo's explicit `current` object instead of `hourly[0]`. This prevents midnight/first-hour values from being presented as the current weather.
- Rain probability is taken from the forecast hour corresponding to the provider's current timestamp.
- 7-day daily data and complete hourly data are returned by the backend.
- Location search is resolved through Open-Meteo geocoding with India restricted.
- Safety advice is retrieved from a local RAG corpus whose source links point to official NDMA SACHET / IMD guidance.
- Satellite provenance is explicit: MOSDAC / SAC / ISRO live application.
- IMD is exposed as an official government source/warnings reference; the backend does not falsely label Open-Meteo values as IMD observations.
- Chat responses are instructed to remain in the selected/detected language.
- Conversation sessions support pause, resume, and reset/new-conversation semantics.

## Endpoints

- `GET /health`
- `GET /api/weather/current?latitude=...&longitude=...`
- `GET /api/weather/by-city?city=...`
- `GET /api/weather/forecast?latitude=...&longitude=...&days=7`
- `GET /api/weather/sources`
- `POST /api/chat`
- `POST /api/chat/session`
- `POST /api/chat/session/{id}/pause`
- `POST /api/chat/session/{id}/resume`
- `POST /api/chat/session/{id}/new`

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Set `AI_PROVIDER=fallback` to test without an AI key. For generated multilingual responses and richer RAG-grounded answers, configure `ollama`, `openai`, or `gemini`.

## Satellite

The backend deliberately returns the official MOSDAC URL rather than proxying or altering the satellite application. The frontend should embed:

`https://mosdac.gov.in/live/`

Label it as:

`Official MOSDAC / Space Applications Centre, ISRO view`

## Safety/RAG

`app/knowledge/safety.json` is a small, auditable retrieval corpus. It is intentionally local and source-attributed. For production, refresh/curate it from current official NDMA/IMD guidance and add a dynamic official-warning adapter rather than treating model forecasts as government warnings.

## Session limitation

Session state is in memory for this local/dev implementation. For production, replace `SESSIONS` with Redis or a database so pause/new state survives restarts and multiple workers.
