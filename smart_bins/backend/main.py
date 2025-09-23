from fastapi import FastAPI
from database import Base, engine
from routes import bins, readings

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(bins.router, prefix="/bins", tags=["bins"])
app.include_router(readings.router, prefix="/readings", tags=["readings"])

@app.get("/")
def get():
    return {"message":"Server started"}
