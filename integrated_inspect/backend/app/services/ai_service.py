import os, re, httpx
from .weather_service import get_forecast, pick_current, condition, geocode_city, daily_items, current_hour_probability, LANGUAGE_NAMES
from .rag_service import build_context

DEFAULT_CITY = os.getenv("DEFAULT_CITY", "Bhimavaram")

def detect_language(text: str, requested: str = "en") -> str:
    if requested in LANGUAGE_NAMES and requested != "en":
        return requested
    ranges = [
        ("te", r"[\u0C00-\u0C7F]"), ("ta", r"[\u0B80-\u0BFF]"),
        ("kn", r"[\u0C80-\u0CFF]"), ("ml", r"[\u0D00-\u0D7F]"),
        ("mr", r"(?:आहे|आणि|मध्ये|उद्या|पाऊस|हवामान|तापमान|काय)"),
        ("hi", r"[\u0900-\u097F]"), ("bn", r"[\u0980-\u09FF]"),
        ("gu", r"[\u0A80-\u0AFF]"), ("pa", r"[\u0A00-\u0A7F]"),
    ]
    for lang, pattern in ranges:
        if re.search(pattern, text):
            return lang
    return "en"

STOP_WORDS = {
    "what", "whats", "what's", "how", "hows", "how's", "weather", "forecast", "climate",
    "temperature", "temp", "rain", "raining", "rains", "rainfall", "shower", "showers",
    "cloud", "cloudy", "clouds", "sun", "sunny", "wind", "windy", "humidity", "hot", "cold",
    "today", "tomorrow", "tonight", "now", "currently", "current", "live", "day", "night",
    "morning", "evening", "afternoon", "week", "this", "next", "is", "are", "will", "can",
    "could", "should", "would", "do", "does", "did", "tell", "show", "check", "give", "please",
    "me", "you", "it", "its", "it's", "the", "a", "an", "and", "or", "there", "here", "any",
    "safe", "safety", "precaution", "precautions", "advice", "suggest", "travel", "outside",
    "go", "good", "bad", "umbrella", "chance", "status", "condition", "conditions", "update",
    "updates", "report", "reports", "hello", "hi", "hey", "yes", "no", "ok", "okay", "thanks",
    "thank", "about", "like", "in", "at", "for", "near", "around", "of", "to", "from",
    "kaisa", "hai", "kya", "hoga", "varsham", "padtunda", "paduthundha", "elaga", "undi",
}

def _clean_candidate(c: str) -> str:
    c = c.strip(" .,'\"?!:;")
    c = re.sub(r"^(?:today|tomorrow|tonight|now|this\s+evening|this\s+week|next\s+week|आज|कल|अभी|ఈ\s*రోజు|రేపు|ఇప్పుడు|இன்று|நாளை|இப்போது|ಇಂದು|ನಾಳೆ|ಈಗ)\s+", "", c, flags=re.I).strip()
    c = re.sub(r"^(?:the\s+|a\s+|an\s+)", "", c, flags=re.I).strip()
    c = re.sub(r"\s+(?:weather|forecast|temperature|temp|climate|rain|raining|rainfall|conditions?|status)$", "", c, flags=re.I).strip()
    c = re.sub(r"^(?:weather|forecast|temperature|temp|climate|rain|conditions?)\s+(?:in|at|for|of|near|around)?\s*", "", c, flags=re.I).strip()
    return c.strip(" .,'\"?!:;")

def _extract_city(message: str) -> str | None:
    text = " ".join(message.strip().split())
    if not text:
        return None

    patterns = [
        # "what about X", "how about X", "tell me about X"
        r"\b(?:what\s+about|how\s+about|tell\s+me\s+about|check|show\s+me|see)\s+([A-Za-z\u0080-\uFFFF][A-Za-z\u0080-\uFFFF .'-]{1,50}?)(?:\s+(?:today|tomorrow|tonight|this evening|this week|next week|now)\b|[?.!,]|$)",
        # "weather/forecast/temp in/at/for/near/around/of X"
        r"\b(?:weather|forecast|temperature|climate|conditions?|rain|rainfall)\s+(?:in|at|for|near|around|of)\s+([A-Za-z\u0080-\uFFFF][A-Za-z\u0080-\uFFFF .'-]{1,50}?)(?:\s+(?:today|tomorrow|tonight|this evening|this week|next week|now)\b|[?.!,]|$)",
        # "in/at/for/near/around/of X"
        r"\b(?:in|at|for|near|around|of)\s+([A-Za-z\u0080-\uFFFF][A-Za-z\u0080-\uFFFF .'-]{1,50}?)(?:\s+(?:today|tomorrow|tonight|this evening|this week|next week|now)\b|[?.!,]|$)",
        # Transliterated Indian locatives: "Vijayawada lo", "Mumbai mein", "Chennai il", "Jaipur me"
        r"\b([A-Za-z][A-Za-z .'-]{1,50}?)\s+(?:lo|loni|me|mein|il|nalli|ka\s+mausam|ki\s+barish)\b",
        # "<city> weather/forecast/temperature"
        r"^([A-Za-z\u0080-\uFFFF][A-Za-z\u0080-\uFFFF .'-]{1,50}?)\s+(?:weather|forecast|temperature|climate|rain|rainfall|conditions?)(?:\s+(?:today|tomorrow|tonight|now)|[?.!,]|$)",
        # Telugu: <city> lo / loni / vadda / kosam / gurinchi
        r"\b([A-Za-z\u0C00-\u0C7F .'-]{2,50}?)(?:లో|లోని|వద్ద|కోసం|గురించి)(?:\s|[?.!,]|$)",
        r"(?:లో|లోని|వద్ద|కోసం|గురించి)\s+([\u0C00-\u0C7F\w .'-]{2,50}?)(?:\s+(?:ఈ రోజు|రేపు|ఇప్పుడు)|[?.!,]|$)",
        # Hindi: <city> me / par / ke liye / ke bare me / ka mausam / ki barish
        r"\b([A-Za-z\u0900-\u097F .'-]{2,50}?)\s+(?:में|पर|के लिए|के बारे में|का मौसम|की बारिश|का तापमान)(?:\s|[?.!,]|$)",
        r"(?:में|पर|के लिए|के बारे में)\s+([\u0900-\u097F\w .'-]{2,50}?)(?:\s+(?:आज|कल|अभी)|[?.!,]|$)",
        # Tamil: <city> il / kaga / patri / vanilai
        r"\b([A-Za-z\u0B80-\u0BFF .'-]{2,50}?)\s*(?:இல்|க்காக|பற்றி|வானிலை)(?:\s|[?.!,]|$)",
        r"(?:இல்|க்காக|பற்றி)\s+([\u0B80-\u0BFF\w .'-]{2,50}?)(?:\s+(?:இன்று|நாளை|இப்போது)|[?.!,]|$)",
        # Kannada: <city> nalli / gagi / kuritu / havamana
        r"\b([A-Za-z\u0C80-\u0CFF .'-]{2,50}?)\s*(?:ನಲ್ಲಿ|ಗಾಗಿ|ಕುರಿತು|ಹವಾಮಾನ)(?:\s|[?.!,]|$)",
        r"(?:ನಲ್ಲಿ|ಗಾಗಿ|ಕುರಿತು)\s+([\u0C80-\u0CFF\w .'-]{2,50}?)(?:\s+(?:ಇಂದು|நாளை|ಈಗ)|[?.!,]|$)",
    ]

    for p in patterns:
        m = re.search(p, text, re.I)
        if m:
            cand = _clean_candidate(m.group(1))
            cand_words = set(re.findall(r"\b[A-Za-z]+\b", cand.lower()))
            if cand and not cand_words.issubset(STOP_WORDS):
                return cand

    # Direct location input: e.g. "Mumbai", "New Delhi", "Chennai", "Kolkata, WB"
    clean_text = text.strip(" .?!,;\"'")
    words = clean_text.split()
    if 1 <= len(words) <= 4:
        lowered_words = [w.lower() for w in re.findall(r"\b[A-Za-z]+\b", clean_text)]
        question_or_verbs = {
            "is", "are", "will", "can", "could", "should", "would", "do", "does", "did",
            "how", "what", "why", "when", "who", "hi", "hello", "hey", "thanks", "thank",
            "please", "give", "show", "tell", "check", "safe", "danger", "varsham", "padtunda"
        }
        if lowered_words and not set(lowered_words).intersection(question_or_verbs):
            if not set(lowered_words).issubset(STOP_WORDS):
                return _clean_candidate(clean_text)

    return None

def _is_tomorrow(message): return bool(re.search(r"\btomorrow\b|\bnext\s+day\b|రేపు|कल|நாளை|ನಾಳೆ|उद्या", message, re.I))
def _is_today(message): return bool(re.search(r"\btoday\b|\bnow\b|\bcurrently\b|\bright\s+now\b|ఈ రోజు|ఇప్పుడు|आज|अभी|இன்று|இப்போது|ಇಂದು|ಈಗ", message, re.I))
def _safety_question(message): return bool(re.search(r"\b(safe|safety|precaution|precautions|suggest|advice|should i|can i|danger|risk|travel|outside|go out)\b|సురక్షిత|జాగ్రత్త|సలహా|ప్రమాద|బచావ|सुरक्षित|सावधानी|सलाह|பாதுகாப்பு|எச்சரிக்கை|ಸುರಕ್ಷಿತ|ಎಚ್ಚರಿಕೆ|ಸಲಹೆ|धोका|सुरक्षा", message, re.I))

def _risk(weather, daily):
    code = int(weather.get("weather_code", -1))
    rain = float(daily.get("rain_probability") or 0)
    precip = float(daily.get("precipitation_sum") or 0)
    gust = float(daily.get("wind_gusts_max") or 0)
    if code in {95,96,99} or gust >= 60 or rain >= 80 or precip >= 64.5: return "HIGH"
    if gust >= 40 or rain >= 50 or precip >= 15.6: return "MODERATE"
    return "LOW"

def _fallback_safety(risk, docs, language):
    if not docs: return ""
    titles = [d["title"] for d in docs]
    if language == "te": return "భద్రత: " + " / ".join(titles) + " కు సంబంధించిన అధికారిక సూచనలను అనుసరించండి. ప్రమాదకర వాతావరణంలో అవసరం లేని బయట ప్రయాణాన్ని నివారించండి."
    if language == "hi": return "सुरक्षा: " + " / ".join(titles) + " से जुड़ी आधिकारिक सलाह का पालन करें। खराब मौसम में अनावश्यक बाहर निकलने से बचें।"
    if language == "ta": return "பாதுகாப்பு: " + " / ".join(titles) + " தொடர்பான அதிகாரப்பூர்வ அறிவுரைகளைப் பின்பற்றுங்கள். மோசமான வானிலையில் தேவையற்ற வெளியே செல்வதைத் தவிர்க்கவும்."
    return "Safety: Follow the official guidance for " + " / ".join(titles) + ". Avoid unnecessary outdoor travel during hazardous conditions."

async def generate_answer(message, conversation, language, latitude, longitude, location_name):
    language = detect_language(message, language)
    city = location_name.strip() if location_name and location_name.strip() else None

    # Priority 1: Check if the user's message explicitly specifies a location
    extracted = _extract_city(message)
    if extracted:
        try:
            loc = await geocode_city(extracted, language)
            latitude, longitude, city = float(loc["latitude"]), float(loc["longitude"]), loc["name"]
        except Exception:
            # If geocoding extracted candidate failed, keep going with existing coordinates/city
            pass

    # Priority 2: If we still don't have coordinates, resolve from city or default
    if latitude is None or longitude is None:
        target = city or DEFAULT_CITY
        try:
            loc = await geocode_city(target, language)
            latitude, longitude, city = float(loc["latitude"]), float(loc["longitude"]), loc["name"]
        except Exception:
            loc = await geocode_city(DEFAULT_CITY, language)
            latitude, longitude, city = float(loc["latitude"]), float(loc["longitude"]), loc["name"]
    elif not city:
        city = "Selected location"


    raw = await get_forecast(latitude, longitude, 7)
    weather = pick_current(raw)
    weather["rain_probability"] = current_hour_probability(raw)
    days = daily_items(raw)
    today = days[0] if days else {}
    tomorrow = days[1] if len(days) > 1 else {}
    selected = tomorrow if _is_tomorrow(message) and tomorrow else today
    risk = _risk(weather, selected)
    rag = build_context(message, {**weather, **selected}, language)

    context = {
        "city": city, "coordinates": {"latitude": latitude, "longitude": longitude},
        "weather": weather, "today_forecast": today, "tomorrow_forecast": tomorrow,
        "risk": risk, "safety_rag": rag,
    }

    provider = os.getenv("AI_PROVIDER", "fallback").lower()
    if provider == "ollama":
        answer = await _ollama(message, conversation, language, context)
    elif provider == "openai":
        answer = await _openai(message, conversation, language, context)
    elif provider == "gemini":
        answer = await _gemini(message, conversation, language, context)
    else:
        answer = fallback_answer(message, context, language)

    docs = rag["documents"]
    advisory = _fallback_safety(risk, docs, language) if _safety_question(message) or risk != "LOW" else ""
    return {
        "text": answer,
        "language": language,
        "location": {"name": city, "latitude": latitude, "longitude": longitude},
        "metrics": {
            "temp": f'{(round(float(selected.get("max_temperature", weather["temperature"]))) if _is_tomorrow(message) else round(float(weather["temperature"])))}°C',
            "rain": f'{round(float(selected.get("rain_probability") or weather["rain_probability"] or 0))}%',
            "humidity": f'{round(float(weather["humidity"]))}%',
            "wind": f'{round(float(selected.get("wind_speed_max", weather["wind_speed"])))} km/h',
            "risk": risk, "confidence": "Open-Meteo forecast",
        },
        "advisory": advisory,
        "safety_sources": rag["sources"],
        "source": "Open-Meteo forecast + official safety guidance retrieval",
        "satellite": {
            "provider": "MOSDAC / SAC / ISRO",
            "live_url": "https://mosdac.gov.in/live/",
            "embed_url": "https://mosdac.gov.in/live/",
        },
        "imd": {"api_url": "https://api.imd.gov.in/", "warnings_url": "https://mausam.imd.gov.in/"},
    }

def fallback_answer(message, context, language):
    city, w, t, tm = context["city"], context["weather"], context["today_forecast"], context["tomorrow_forecast"]
    if language == "hi":
        if _is_tomorrow(message): return f"{city} में कल अधिकतम तापमान लगभग {round(tm.get('max_temperature',0))}°C और बारिश की संभावना {round(tm.get('rain_probability',0))}% है।"
        return f"{city} में अभी तापमान लगभग {round(w['temperature'])}°C है और मौसम {w['condition']} है। इस घंटे बारिश की संभावना लगभग {round(w['rain_probability'] or 0)}% है।"
    if language == "te":
        if _is_tomorrow(message): return f"{city}లో రేపు గరిష్ఠ ఉష్ణోగ్రత సుమారు {round(tm.get('max_temperature',0))}°C, వర్షం అవకాశం {round(tm.get('rain_probability',0))}% ఉంది."
        return f"{city}లో ప్రస్తుతం ఉష్ణోగ్రత సుమారు {round(w['temperature'])}°C ఉంది. వాతావరణం {w['condition']}. ఈ గంటలో వర్షం అవకాశం సుమారు {round(w['rain_probability'] or 0)}%."
    if language == "ta":
        if _is_tomorrow(message): return f"{city} இல் நாளை அதிகபட்ச வெப்பநிலை சுமார் {round(tm.get('max_temperature',0))}°C; மழை வாய்ப்பு {round(tm.get('rain_probability',0))}%."
        return f"{city} இல் தற்போது சுமார் {round(w['temperature'])}°C உள்ளது. நிலை {w['condition']}. இந்த மணிநேர மழை வாய்ப்பு {round(w['rain_probability'] or 0)}%."
    return (f"Tomorrow in {city}, the high is about {round(tm.get('max_temperature',0))}°C with a {round(tm.get('rain_probability',0))}% chance of rain."
            if _is_tomorrow(message) else
            f"In {city}, the current temperature is about {round(w['temperature'])}°C with {w['condition'].lower()}. The current-hour precipitation probability is about {round(w['rain_probability'] or 0)}%.")

def _messages(conversation, language, context):
    safety = "\n".join(f"- {d['title']}: {d['text']} Source: {d['source_url']}" for d in context["safety_rag"]["documents"])
    system = f"""You are WeatherGPT for India. Answer ONLY using supplied telemetry and retrieved safety guidance. Never invent measurements or official warnings.
Always answer in {LANGUAGE_NAMES.get(language,'English')} and continue in the same language. Do not switch language unless the user explicitly asks.
Distinguish model forecast data from official warnings. If safety is requested, give practical precautions from the retrieved sources. Do not claim an IMD alert unless supplied.
Telemetry: {context}
Retrieved safety guidance:
{safety}"""
    msgs = [{"role":"system","content":system}]
    for item in conversation[-10:]:
        if item.get("content"):
            role = item.get("role") if item.get("role") in {"user","assistant","system"} else "user"
            msgs.append({"role":role,"content":item["content"]})
    msgs.append({"role":"user","content":context.get("_message","")})
    return msgs

async def _ollama(message, conversation, language, context):
    endpoint=os.getenv("OLLAMA_ENDPOINT","http://localhost:11434").rstrip("/")
    context["_message"]=message
    async with httpx.AsyncClient(timeout=45) as c:
        r=await c.post(f"{endpoint}/api/chat",json={"model":os.getenv("OLLAMA_MODEL","phi4-mini"),"stream":False,"messages":_messages(conversation,language,context)})
        r.raise_for_status(); return r.json()["message"]["content"]

async def _openai(message, conversation, language, context):
    key=os.getenv("OPENAI_API_KEY")
    if not key: return fallback_answer(message,context,language)
    context["_message"]=message
    async with httpx.AsyncClient(timeout=45) as c:
        r=await c.post(os.getenv("OPENAI_BASE_URL","https://api.openai.com/v1/chat/completions"),headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},json={"model":os.getenv("OPENAI_MODEL","gpt-4.1-mini"),"messages":_messages(conversation,language,context),"temperature":0.1})
        r.raise_for_status(); return r.json()["choices"][0]["message"]["content"]

async def _gemini(message, conversation, language, context):
    key=os.getenv("GEMINI_API_KEY")
    if not key: return fallback_answer(message,context,language)
    context["_message"]=message
    prompt="\n".join(f"{m['role'].upper()}: {m['content']}" for m in _messages(conversation,language,context))
    url=f"https://generativelanguage.googleapis.com/v1beta/models/{os.getenv('GEMINI_MODEL','gemini-2.5-flash')}:generateContent?key={key}"
    async with httpx.AsyncClient(timeout=45) as c:
        r=await c.post(url,json={"contents":[{"parts":[{"text":prompt}]}]})
        r.raise_for_status(); return r.json()["candidates"][0]["content"]["parts"][0]["text"]
