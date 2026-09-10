# WeatherGPT Phase 2 — Integrated Backend + Frontend

This package connects the supplied React/Vite frontend to the supplied FastAPI backend.

## Data flow

Location search -> React weatherService -> FastAPI -> Open-Meteo geocoding/forecast -> frontend weather/forecast pages.

Chat -> FastAPI `/api/chat` -> live weather telemetry + local safety RAG -> configured AI provider/fallback.

Satellite -> official MOSDAC Live application:
https://mosdac.gov.in/live/

IMD reference:
https://api.imd.gov.in/
Official warnings:
https://mausam.imd.gov.in/

## Important accuracy/provenance behavior

- Current weather uses Open-Meteo's explicit `current` object, not `hourly[0]`.
- Rain probability is aligned to the current provider timestamp.
- Seven-day and hourly forecast data come through the backend.
- Open-Meteo model output is never labelled as an IMD observation.
- Satellite imagery is kept separate from point weather measurements.
- AQI is not fabricated where no AQI provider is present.
- Safety answers are grounded in the local official-guidance RAG corpus and avoid inventing official alerts.

## Chat

The frontend now uses the backend chat API and supports:
- language detection/selected-language continuity
- persistent in-memory session history
- Pause
- Resume
- New conversation
- aborting an in-flight browser request when paused/new conversation is selected

For production, replace the in-memory session store with Redis or a database.

## Run backend (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Run frontend

```powershell
cd frontend
npm install
npm run dev
```

If Vite reports a missing native optional dependency, delete `node_modules` and `package-lock.json`, then run `npm install` again. The uploaded environment contained an incomplete native Rolldown optional dependency, so a clean install is required before building locally.

## Configuration

Frontend `.env.example`:
`VITE_API_BASE_URL=http://localhost:8000`

Backend `.env.example`:
- `AI_PROVIDER=fallback` for deterministic local testing
- `AI_PROVIDER=ollama` + Ollama settings for local LLM
- `AI_PROVIDER=openai` + `OPENAI_API_KEY`
- `AI_PROVIDER=gemini` + `GEMINI_API_KEY`

Do not put production AI API keys into frontend source or client-side storage.

## Note about MOSDAC embedding

The frontend embeds the official MOSDAC Live page. Whether an external site permits iframe embedding is controlled by MOSDAC/browser security headers. The dashboard therefore also provides an external-source link. The backend does not proxy or alter the satellite imagery.
