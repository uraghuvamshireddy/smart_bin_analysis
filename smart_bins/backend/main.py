from fastapi import FastAPI
from database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from routes import bins, readings,auth,alerts,tasks,dashboard
from routes.analytics import router as analytics_router
from routes.ml import router as ml_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.include_router(bins.router, prefix="/bins", tags=["bins"])
app.include_router(readings.router, prefix="/readings", tags=["readings"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(alerts.router,prefix='/alert',tags=['alerts'])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(analytics_router)  
app.include_router(ml_router)
@app.get("/")
def get():
    return {"message":"Server started"}
