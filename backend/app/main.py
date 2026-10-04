from fastapi import FastAPI
from app.routers import auth, patients, doctors, appointments
from starlette.middleware.sessions import SessionMiddleware
from app.config import SECRET_KEY
from app.routers import auth, patients, doctors, appointments,admins

app = FastAPI(title="MediCare")

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(admins.router)

@app.get("/")
def home():
    return {"message": "Welcome to MediCare."}