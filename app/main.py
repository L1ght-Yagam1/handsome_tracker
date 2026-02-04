from fastapi import FastAPI
from app.api import notes
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


app = FastAPI(prefix="/api/v1")

app.include_router(notes.router)
