from pydantic import BaseModel
from datetime import date

class PatientCreate(BaseModel):
    name: str
    phone: str
    dob: date
    gender: str
    address: str

class PatientUpdate(BaseModel):
    name: str
    phone: str
    dob: date
    gender: str
    address: str

class PatientResponse(BaseModel):
    patient_id: int
    user_id: int
    name: str
    phone: str
    dob: date
    gender: str
    address: str