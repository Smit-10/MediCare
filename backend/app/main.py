from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from app.config import SECRET_KEY, FRONTEND_URL
from app.routers import auth, patients, doctors, appointments,admins
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MediCare")

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(admins.router)

@app.get("/")
def home():
    return {"message": "Welcome to MediCare."}