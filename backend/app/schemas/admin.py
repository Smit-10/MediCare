from pydantic import BaseModel,EmailStr


class Doctor(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    specialization_id: int
    qualification: str
    experience: int
    bio: str
    availability: str

class Update_Doctor(BaseModel):
    name: str
    phone: str
    specialization_id: int 
    qualification: str
    experience: str
    bio: str
    availability: str
