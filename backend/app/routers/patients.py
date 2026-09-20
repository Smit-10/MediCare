from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services.patient_service import create_patient, get_patient, update_patient
from app.auth.jwt_handler import get_current_user

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)

@router.post("/profile", response_model=PatientResponse)
def create_patient_profile(patient: PatientCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create a patient profile"
        )
        
    result = create_patient(
        current_user["user_id"],
        patient.name,
        patient.phone,
        patient.dob,
        patient.gender,
        patient.address
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient profile already exists"
        )
    
    return {
        "patient_id": result[0],
        "user_id": result[1],
        "name": result[2],
        "phone": result[3],
        "dob": result[4],
        "gender": result[5],
        "address": result[6]
    }

@router.get("/profile", response_model=PatientResponse)
def get_patient_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this profile"
        )
    result = get_patient(current_user["user_id"])
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    return {
        "patient_id": result[0],
        "user_id": result[1],
        "name": result[2],
        "phone": result[3],
        "dob": result[4],
        "gender": result[5],
        "address": result[6]
    }

@router.put("/profile", response_model=PatientResponse)
def update_patient_profile(patient: PatientUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can update their profile"
        )
    result = update_patient(
        current_user["user_id"],
        patient.name,
        patient.phone,
        patient.dob,
        patient.gender,
        patient.address
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    return {
        "patient_id": result[0],
        "user_id": result[1],
        "name": result[2],
        "phone": result[3],
        "dob": result[4],
        "gender": result[5],
        "address": result[6]
    }