# Handsome
[![CI](https://github.com/L1ght-Yagam1/handsome_tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/L1ght-Yagam1/handsome_tracker/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/L1ght-Yagam1/handsome_tracker/graph/badge.svg?branch=main)](https://codecov.io/gh/L1ght-Yagam1/handsome_tracker)

Проект разделен на две части:

- `backend` — FastAPI + Alembic + тесты
- `frontend` — React + Vite

## Backend

```bash
cd backend
python3 -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Backend по умолчанию: `http://127.0.0.1:8000`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend по умолчанию: `http://localhost:5173`

## Тесты backend

```bash
cd backend
../.venv/bin/pytest -q tests
```
