# handsome front

Basic React + Vite starter for the handsome project (`users` and `notes` UI).

## Run

```bash
npm install
npm run dev
```

## Backend API

Create `.env` from `.env.example` and set backend URL:

```bash
VITE_API_URL=/api/v1
VITE_BACKEND_URL=http://localhost:8000
```

Frontend expects your current FastAPI contract:

- `POST /api/v1/auth/login/access-token` (`username`/`password` form-data)
- `GET /api/v1/notes/`, `POST /api/v1/notes/` with `{ "title": "...", "content": "..." }`, `DELETE /api/v1/notes/{id}`
- `GET /api/v1/users/`, `POST /api/v1/users/`, `DELETE /api/v1/users/{id}` (requires admin access token)

## Build

```bash
npm run build
npm run preview
```
