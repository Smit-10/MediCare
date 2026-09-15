from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.jwt_handler import get_current_user
from app.services.doctor_service import search_doctors

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)

@router.get("/")
def get_doctors(specialization: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can search for doctors"
        )
    
    doctors = search_doctors(specialization)
    
    if not doctors:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No doctors found for this specialization"
        )
    
    result = []
    
    for doctor in doctors:
        result.append({
            "doctor_id": doctor[0],
            "name": doctor[1],
            "specialization": doctor[2],
            "phone": doctor[3],
            "qualification": doctor[4],
            "experience": doctor[5],
            "bio": doctor[6],
            "availability": doctor[7]
        })
    
    return {
        "specialization": specialization,
        "doctors": result
    }