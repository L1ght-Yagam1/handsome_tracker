from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Handsome FastAPI App")

class Message(BaseModel):
    message: str


@app.get("/", response_model=Message)
def read_root():
    return {"message": "Hello, FastAPI!"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
