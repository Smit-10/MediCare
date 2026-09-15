from fastapi import FastAPI
from app.routers import auth, patients, doctors, appointments

app = FastAPI(title="MediCare")

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)

@app.get("/")
def home():
    return {"message": "Welcome to MediCare."}