from fastapi import WebSocket
from typing import Dict
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        await self.broadcast_status(user_id, "online")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: str):
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_text(message)

    async def broadcast_status(self, user_id: str, status: str):
        msg = json.dumps({"type": "user_status", "user_id": user_id, "status": status})
        for uid, ws in self.active_connections.items():
            if uid != user_id:
                try:
                    await ws.send_text(msg)
                except Exception:
                    pass
