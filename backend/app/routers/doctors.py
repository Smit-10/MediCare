from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.jwt_handler import get_current_user
from app.schemas.appointment import AppointmentStatusUpdate
from app.schemas.doctor import DoctorProfileUpdate, DoctorAvailabilityUpdate
from app.services.doctor_service import (
    search_doctors,
    get_doctor_profile,
    update_doctor_profile,
    get_doctor_appointments,
    update_appointment_status,
    update_doctor_availability,
    get_my_patients,
    get_patient_medical_history
)

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

@router.get("/profile")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this profile"
        )
    
    doctor = get_doctor_profile(current_user["user_id"])
    
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    return {
        "doctor_id": doctor[0],
        "user_id": doctor[1],
        "name": doctor[2],
        "phone": doctor[3],
        "qualification": doctor[4],
        "experience": doctor[5],
        "bio": doctor[6],
        "availability": doctor[7],
        "specialization_id": doctor[8],
        "specialization": doctor[9]
    }

@router.put("/profile")
def update_my_profile(doctor: DoctorProfileUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update this profile"
        )
    
    result = update_doctor_profile(
        current_user["user_id"],
        doctor.name,
        doctor.phone,
        doctor.qualification,
        doctor.experience,
        doctor.bio
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    return {
        "message": "Doctor profile updated successfully",
        "doctor": {
            "doctor_id": result[0],
            "user_id": result[1],
            "name": result[2],
            "phone": result[3],
            "qualification": result[4],
            "experience": result[5],
            "bio": result[6],
            "availability": result[7]
        }
    }

@router.get("/appointments")
def get_my_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access doctor appointments"
        )
        
    appointments = get_doctor_appointments(current_user["user_id"])
    
    if appointments is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    result = []
    
    for appointment in appointments:
        result.append({
            "appointment_id": appointment[0],
            "patient_id": appointment[1],
            "patient_name": appointment[2],
            "patient_phone": appointment[3],
            "appointment_date": appointment[4],
            "appointment_time": appointment[5],
            "status": appointment[6],
            "reason": appointment[7],
            "created_at": appointment[8],
            "updated_at": appointment[9]
        })
        
    return {
        "appointments": result
    }

@router.put("/appointments/{appointment_id}/status")
def update_status(appointment_id: int, appointment: AppointmentStatusUpdate, current_user:dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update appointment status"
        )
    
    if appointment.status not in ("Confirmed", "Rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be Confirmed or Rejection"
        )
    
    result, Status = update_appointment_status(
        current_user["user_id"], 
        appointment_id, 
        appointment.status
    )
    
    if Status == 'doctor_not_found':
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    if Status == 'appointment_not_found':
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if Status == 'invalid_status':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending appointments can be accepted or rejected"
        )
    
    return {
        "message": "Appointment status updated successfully",
        "appointment": {
            "appointment_id": result[0],
            "patient_id": result[1],
            "doctor_id": result[2],
            "appointment_date": result[3],
            "appointment_time": result[4],
            "status": result[5],
            "reason": result[6],
            "created_at": result[7],
            "updated_at": result[8]
        }
    }

@router.put("/availability")
def update_availability(availability: DoctorAvailabilityUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update availability"
        )
    
    result, Status = update_doctor_availability(current_user["user_id"], availability.availability)
    
    if Status == "doctor_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    return {
        "message": "Doctor availability updated successfully",
        "availability": result[1]
    }

@router.get("/my-patients")
def get_my_patients_list(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this endpoint"
        )
    
    patients, Status = get_my_patients(current_user["user_id"])
    
    if Status == "doctor_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    patient_list = []
    
    for patient in patients:
        patient_list.append({
            "patient_id": patient[0],
            "name": patient[1],
            "phone": patient[2],
            "dob": patient[3],
            "gender": patient[4]
        })
    
    return {
        "patients": patient_list
    }

@router.get("/my-patients/{patient_id}/medical_history")
def get_patient_history(patient_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access patient medical history"
        )
    
    result, Status = get_patient_medical_history(current_user["user_id"], patient_id)
    
    if Status == "doctor_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    if Status == "patient_not_found":
        raise HTTPException(
            status_code=404,
            detail="Patient not found in your patient list"
        )
    
    patient = result["patient"]
    appointments = result["appointments"]
    
    appointment_list = []

    for appointment in appointments:
        appointment_list.append({
            "appointment_id": appointment[0],
            "appointment_date": appointment[1],
            "appointment_time": appointment[2],
            "status": appointment[3],
            "reason": appointment[4]
        })
    
    return {
        "patient": {
            "patient_id": patient[0],
            "name": patient[1],
            "phone": patient[2],
            "dob": patient[3],
            "gender": patient[4],
            "address": patient[5]
        },
        "appointments": appointment_list
    }