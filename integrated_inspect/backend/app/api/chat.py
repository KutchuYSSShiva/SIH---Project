from fastapi import APIRouter, HTTPException
from uuid import uuid4
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import generate_answer

router = APIRouter()
SESSIONS: dict[str, dict] = {}

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        session = SESSIONS.get(request.session_id) if request.session_id else None
        if session and session["paused"]:
            raise HTTPException(status_code=409, detail="Conversation is paused. Start or resume the conversation before sending messages.")
        conversation = [m.model_dump() for m in request.conversation]
        if session and session["messages"]:
            conversation = session["messages"][-20:] + conversation[-20:]
        lat = request.latitude
        lon = request.longitude
        loc_name = request.location_name
        if session and lat is None and lon is None:
            session_loc = session.get("location_name")
            # Only reuse session lat/lon if the request didn't specify a different location name
            if not loc_name or (session_loc and loc_name.strip().casefold() == session_loc.strip().casefold()):
                lat = session.get("latitude")
                lon = session.get("longitude")
                loc_name = session_loc
        result = await generate_answer(request.message, conversation, request.language, lat, lon, loc_name)
        if request.session_id:
            session = SESSIONS.setdefault(request.session_id, {"paused":False,"messages":[]})
            session["latitude"] = result["location"].get("latitude")
            session["longitude"] = result["location"].get("longitude")
            session["location_name"] = result["location"].get("name")
            session["language"] = result.get("language", request.language)
            session["messages"].extend([{"role":"user","content":request.message},{"role":"assistant","content":result["text"]}])
            session["messages"] = session["messages"][-40:]
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI/weather service error: {exc}")

@router.post("/session")
async def new_session():
    sid = str(uuid4())
    SESSIONS[sid] = {"paused": False, "messages": []}
    return {"session_id": sid, "paused": False}

@router.post("/session/{session_id}/pause")
async def pause_session(session_id: str):
    if session_id not in SESSIONS: raise HTTPException(status_code=404, detail="Session not found")
    SESSIONS[session_id]["paused"] = True
    return {"session_id": session_id, "paused": True}

@router.post("/session/{session_id}/resume")
async def resume_session(session_id: str):
    if session_id not in SESSIONS: raise HTTPException(status_code=404, detail="Session not found")
    SESSIONS[session_id]["paused"] = False
    return {"session_id": session_id, "paused": False}

@router.post("/session/{session_id}/new")
async def reset_session(session_id: str):
    SESSIONS[session_id] = {"paused": False, "messages": []}
    return {"session_id": session_id, "paused": False}
