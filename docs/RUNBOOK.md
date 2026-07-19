# Lingua Versa AI Operational Runbook

## 1. System Overview
Lingua Versa AI is a real-time voice and chat translation platform.
- **Frontend**: React (Vite)
- **Backend**: NestJS (Node 20)
- **Database**: PostgreSQL (via Supabase)
- **Real-Time**: Socket.io

## 2. Common Alerts & Responses

### High CPU Usage (> 85%)
- **Symptom**: Backend containers consuming high CPU.
- **Action**: Check Winston logs (`logs/combined.log`) for excessive translation processing. If legitimate traffic, scale out backend containers (`docker compose up -d --scale backend=3`).

### WebSocket Disconnections
- **Symptom**: Admin dashboard shows active sockets dropping sharply.
- **Action**: Verify Nginx reverse proxy timeouts and check if Node process hit memory limit (`OOMKilled`). Increase `maxHttpBufferSize` or Node memory limits if needed.

### Translation API Failures
- **Symptom**: Translations failing (`[Error]` in UI).
- **Action**: Verify `OPENROUTER_API_KEY` is active and not rate-limited. Rotate key if necessary.

## 3. Routine Operations

### Checking Health
```bash
curl http://localhost:5000/health
```
Expected output:
```json
{
  "status": "ok",
  "info": { "database": { "status": "up" }, "memory_heap": { "status": "up" } }
}
```

### Rotating Secrets
Update `.env` on production servers and gracefully restart:
```bash
docker compose up -d --build backend
```
The NestJS shutdown hooks will drain active WebRTC calls before replacing the container.
