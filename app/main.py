from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from google import genai
from app import models, database

# Создаем таблицы
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Настройка нового клиента AI
client = genai.Client(api_key="AIzaSyDWB0e9xy55o8jK5qBDVJLQXNmBbYpamfM")

@app.post("/notes/")
async def create_note(text: str, db: Session = Depends(database.get_db)):
    # Новый синтаксис запроса к Gemini
    response = client.models.generate_content(
        model="gemini-3-flash-preview", 
        contents=f"Сделай краткую выжимку этой заметки: {text}"
    )
    
    new_note = models.Note(content=text, ai_summary=response.text)
    
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return {"message": "Заметка сохранена!", "note": new_note}