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
VITE_API_URL=/api
VITE_BACKEND_URL=http://localhost:8000
```

Frontend expects your current FastAPI contract:

- `POST /login/access-token` (`username`/`password` form-data)
- `GET /notes/`, `POST /notes/` with `{ "title": "...", "content": "..." }`, `DELETE /notes/{id}`
- `GET /users/`, `POST /users/`, `DELETE /users/{id}` (requires admin access token)

## Build

```bash
npm run build
npm run preview
```
