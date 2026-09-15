from pydantic import BaseModel

class DoctorResponse(BaseModel):
    doctor_id: int
    name: str
    specialization: str
    phone: str
    qualification: str
    experience: int
    bio: str
    availability: str