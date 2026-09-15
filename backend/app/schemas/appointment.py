from pydantic import BaseModel
from datetime import date, time, datetime

class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: str
    
class AppointmentResponse(BaseModel):
    appointment_id: int
    doctor_id: int
    doctor_name: str
    specialization: str
    appointment_date: date
    appointment_time: time
    status: str
    reason: str
    created_at: datetime
    updated_at: datetime

class AppointmentReschedule(BaseModel):
    appointment_date: date
    apppointment_time: time