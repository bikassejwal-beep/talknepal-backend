from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
from typing import Dict, List

from app.routers import auth, chat, call, status, users
from app.services.connection_manager import ConnectionManager

app = FastAPI(title="TalkNepal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(call.router, prefix="/api/call", tags=["Call"])
app.include_router(status.router, prefix="/api/status", tags=["Status"])

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            if msg_type == "chat_message":
                await manager.send_to_user(msg["to"], json.dumps({
                    "type": "chat_message",
                    "from": user_id,
                    "message": msg["message"],
                    "timestamp": msg.get("timestamp"),
                    "media_url": msg.get("media_url"),
                }))

            elif msg_type in ("call_offer", "call_answer", "ice_candidate", "call_end"):
                await manager.send_to_user(msg["to"], json.dumps({
                    "type": msg_type,
                    "from": user_id,
                    "data": msg.get("data"),
                    "call_type": msg.get("call_type", "audio"),
                }))

            elif msg_type == "typing":
                await manager.send_to_user(msg["to"], json.dumps({
                    "type": "typing",
                    "from": user_id,
                    "is_typing": msg.get("is_typing", True),
                }))

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast_status(user_id, "offline")


@app.get("/")
def root():
    return {"message": "TalkNepal API is running!", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
