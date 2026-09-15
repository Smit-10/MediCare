from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.jwt_handler import get_current_user
from app.services.appointment_service import book_appointment, get_patient_appointments, reschedule_appointment, cancel_appoinment
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentReschedule

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)

@router.post("/")
def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can book appointments"
        )
    
    result, Status = book_appointment(
        current_user["user_id"],
        appointment.doctor_id,
        appointment.appointment_date,
        appointment.appointment_time,
        appointment.reason
    )
    
    if Status == "patient_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    if Status == "doctor_not_available":
        raise HTTPException(
            status_code=400,
            detail="Doctor is not available on the selected date or time"
        )
    
    if Status == "slot_not_available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The selected appointment slot is not available"
        )
    
    return {
        "message": "Appointment booked successfully",
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

@router.get("/")
def get_my_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can view appointment history"
        )
    
    appointments = get_patient_appointments(current_user["user_id"])
    
    if appointments is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    result = []
    
    for appointment in appointments:
        result.append({
            "appointment_id": appointment[0],
            "doctor_id": appointment[1],
            "doctor_name": appointment[2],
            "specialization": appointment[3],
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

@router.put("/{appointment_id}/reschedule")
def reschedule_my_appointment(appointment_id: int, appointment: AppointmentReschedule, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can reschedule appointments"
        )
    
    result, Status = reschedule_appointment(
        current_user["user_id"],
        appointment_id,
        appointment.appointment_date,
        appointment.apppointment_time
    )
    
    if Status == "patient_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    if Status == "appointment_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if Status == "doctor_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if Status == "doctor_not_available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is not available on the selected date or time"
        )
    
    if Status == "slot_not_available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The selected appointment slot is not available"
        )
    
    return {
        "message": "Appointment rescheduled successfully",
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
    
@router.put("/{appointment_id}/cancel")
def cancel_my_appointment(appointment_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=403,
            detail="Only patients can cancel appointments"
        )

    result, Status = cancel_appoinment(current_user["user_id"], appointment_id)

    if Status == "patient_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

    if Status == "appointment_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if Status == "cannot_cancel":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment cannot be cancelled"
        )

    return {
        "message": "Appointment cancelled successfully",
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