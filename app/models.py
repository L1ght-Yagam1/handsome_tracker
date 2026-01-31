from sqlalchemy import Column, Integer, Text, String, DateTime
from datetime import datetime
from app.database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False) # Текст заметки
    ai_summary = Column(Text)              # Что ответит AI
    created_at = Column(DateTime, default=datetime.utcnow)