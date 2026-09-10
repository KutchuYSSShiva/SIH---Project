# WeatherGPT — Start Here

## Fastest way on Windows

1. Extract the ZIP completely.
2. Open the extracted `WeatherGPT_Phase2_Integrated` folder.
3. Double-click **START_WEATHERGPT.bat**.
4. The launcher will:
   - create the Python virtual environment if needed;
   - install backend packages;
   - create `.env` files when missing;
   - install frontend npm packages when needed;
   - start FastAPI on `http://localhost:8000`;
   - start Vite on `http://localhost:5173`;
   - open the website in your browser.
5. Keep the two terminal windows open while using WeatherGPT.

## Manual startup

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend, in a second terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open:

`http://localhost:5173`

API documentation:

`http://localhost:8000/docs`

## How the website works

### Weather search

User enters a location -> React frontend -> FastAPI -> Open-Meteo geocoding -> Open-Meteo forecast -> FastAPI normalizes the response -> frontend renders current conditions, hourly forecast and seven-day forecast.

### Current weather accuracy

The backend uses Open-Meteo's explicit `current` telemetry instead of treating the first hourly array item as the current observation. Rain probability is aligned to the provider's current forecast hour.

### Satellite

The Climate/Satellite area embeds the official MOSDAC Live application:

`https://mosdac.gov.in/live/`

The dashboard labels it as MOSDAC / SAC / ISRO. Satellite imagery is not fabricated or presented as Open-Meteo point weather data.

### IMD

IMD is kept as an official government reference/alert source. Open-Meteo model values are not falsely labelled as IMD observations.

### Chat

Chat requests go to FastAPI `/api/chat`. The backend injects the searched/current location and live weather telemetry where available. The local safety RAG retrieves relevant safety guidance for weather hazards.

The chat supports session state:
- Pause
- Resume
- New conversation

The selected/detected language is sent to the backend so the assistant can continue in that language.

## AI provider

For local testing, the backend can use its deterministic fallback.

For an actual LLM, configure the backend `.env` according to the provider options in `backend/.env.example`.

**Never put an AI API key in frontend source code.**

## Troubleshooting

### "Python was not found"
Install Python 3.11+ and enable the PATH option during installation.

### "npm was not found"
Install Node.js LTS, restart Windows Terminal/Command Prompt, and run the launcher again.

### Vite dependency/native-module error
Delete `frontend\node_modules` and `frontend\package-lock.json`, then run the launcher again. It will reinstall dependencies.

### Backend does not start
Open the `WeatherGPT Backend` terminal window. The error printed there is the backend startup error.

### Website loads but weather fails
First check:

`http://localhost:8000/health`

It should return a JSON response containing `"status": "ok"`.

Then open:

`http://localhost:8000/docs`

and test the weather endpoints.

### Port already in use
Stop the old Python/Node processes or change the ports in the launcher and frontend configuration consistently.

## Production note

The current conversation session store is in-memory. For production deployment, replace it with Redis or a database, and add proper authentication, rate limiting, structured logging, caching, and production secrets management.
