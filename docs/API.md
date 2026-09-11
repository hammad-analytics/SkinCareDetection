# API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/scans/upload`
- `POST /api/scans/analyze`
- `GET /api/scans`
- `GET /api/scans/:id`
- `GET /api/reports/:id`
- `POST /api/chat`
- `POST /api/knowledge/ingest`
- `GET /api/health`

All protected APIs require `Authorization: Bearer <token>`.

ML service:
- `GET /health`
- `POST /quality-check`
- `POST /predict`
- `POST /gradcam`
