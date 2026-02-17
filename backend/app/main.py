from fastapi import FastAPI
from app.api.routes import login, notes, users
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


app = FastAPI()

app.include_router(login.router)
app.include_router(notes.router)
app.include_router(users.router)