from pydantic import BaseModel
from datetime import date, time, datetime

class DoctorResponse(BaseModel):
    doctor_id: int
    name: str
    specialization: str
    phone: str
    qualification: str
    experience: int
    bio: str
    availability: str

class DoctorProfileUpdate(BaseModel):
    name: str
    phone: str
    qualification: str
    experience: int
    bio: str
    
class DoctorAppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    patient_name: str
    patient_phone: str
    appointment_date: date
    appointment_time: time
    status: str
    reason: str
    created_at: datetime
    updated_at: datetime

class DoctorAvailabilityUpdate(BaseModel):
    availability: str