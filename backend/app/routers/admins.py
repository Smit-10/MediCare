from fastapi import APIRouter,HTTPException,status,Depends
from app.services.admin_service import get_all_details,add_doctor,get_all_doctors,get_specific_doctor,get_update_doctor,update_doctor_status,search_patients,get_specific_patient,update_patient_status,get_specific_appointment,update_appointment_status,get_filter_and_all_appointments
from app.auth.jwt_handler import get_current_user
from app.schemas.admin import Doctor,Update_Doctor
from app.services.auth_service import hash_password
from datetime import date,datetime 

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

# @router.get("/")
# def get_doctors(specialization: str, current_user: dict = Depends(get_current_user)):
#     if current_user["role"] != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Admin access required"
#         )
    
#     doctors = search_doctors(specialization)
    
#     if not doctors:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="No doctors found for this specialization"
#         )
    
#     result = []
    
#     for doctor in doctors:
#         result.append({
#             "doctor_id": doctor[0],
#             "name": doctor[1],
#             "specialization": doctor[2],
#             "phone": doctor[3],
#             "qualification": doctor[4],
#             "experience": doctor[5],
#             "bio": doctor[6],
#             "availability": doctor[7]
#         })
    
#     return {
#         "specialization": specialization,
#         "doctors": result
#     }


@router.get("/dashboard")
def get_details(current_user:dict=Depends(get_current_user)): # get_details(): 
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    all_details = get_all_details()

    return {"totalpatients" : all_details[0],
            "totaldoctors" : all_details[1],
            "totalappointments": all_details[2],
            "pendingappointments": all_details[3],
            "completedappointments" : all_details[4],
            "cancelledappointments": all_details[5]}


@router.post("/doctors")
def create_doctors(doctor:Doctor,current_user:dict=Depends(get_current_user)): #create_doctors(doctor:Doctor): 
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    hash_passwords=hash_password(doctor.password)

    result,message = add_doctor(
        name=doctor.name,
        email=doctor.email,
        hashed_password=hash_passwords,
        phone=doctor.phone,
        specialization_id=doctor.specialization_id,
        qualification=doctor.qualification,
        experience=doctor.experience,
        bio=doctor.bio,
        availability=doctor.availability)

    if message !="success":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=message)

    return{
        "message":"Doctor added sucessfully",
        "Doctor_details": result
    }


@router.get("/doctors")
def view_all_doctors(current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    all_doctors = get_all_doctors()

    result = []
    for doctor in all_doctors:
        result.append({
            "doctor_id":doctor[0],
            "user_id":doctor[1],
            "specializaton_id":doctor[2],
            "name":doctor[3],
            "phone":doctor[4],
            "qualification":doctor[5],
            "experience":doctor[6],
            "bio":doctor[7],
            "availability":doctor[8],
            })
    
    return {
        "doctors": result
    }

@router.get("/doctors/{doctor_id}")
def view_specific_doctor(doctor_id:int,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    doctor = get_specific_doctor(doctor_id=doctor_id)

    return{
        "doctor_id":doctor[0],
        "user_id":doctor[1],
        "specializaton_id":doctor[2],
        "name":doctor[3],
        "phone":doctor[4],
        "qualification":doctor[5],
        "experience":doctor[6],
        "bio":doctor[7],
        "availability":doctor[8],
    }


@router.put("/doctors/{doctor_id}")
def update_doctors(doctor_id:int,doctor:Update_Doctor,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")

    updated_doctor = get_update_doctor(
        doctor_id=doctor_id,
        name=doctor.name,
        phone=doctor.phone,
        specialization_id=doctor.specialization_id, 
        qualification=doctor.qualification,
        experience=doctor.experience,
        bio=doctor.bio,
        availability=doctor.availability)
    
    if updated_doctor is None:
        raise HTTPException(status_code=404,detail="Doctor not found")
        
    return{
        "message": "Doctor profile updated successfully",
        "doctor": {"doctor_id":updated_doctor[0],
            "user_id":updated_doctor[1],
            "specialization_id":updated_doctor[2],
            "name":updated_doctor[3],
            "phone":updated_doctor[4],
            "qualification":updated_doctor[5],
            "experience":updated_doctor[6],
            "bio":updated_doctor[7],
            "availability":updated_doctor[8]
            }
    }


@router.put("/doctors/{doctor_id}/status")
def change_doctor_status(doctor_id:int,status:str,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")

    status=status.capitalize()

    if status not in ["Active", "Inactive"]:
        raise HTTPException(status_code=400,detail="Status must be active or inactive")

    result, message = update_doctor_status(doctor_id,status)

    if message != "success":
        raise HTTPException(status_code=404,detail=message)

    return {
        "message": "Doctor status updated successfully",
        "doctor": result
    }


# @router.get("/patients")
# def view_all_patients():

#     all_patients=get_all_patients()

#     result = []
#     for patients in all_patients:
#         result.append({
#             "patient_id":patients[0],
#             "user_id":patients[1],
#             "name":patients[2],
#             "phone":patients[3],
#             "dob":patients[4],
#             "gender":patients[5],
#             "address":patients[6],
#             })
    
#     return {
#         "patients": result
#     }


@router.get("/patients")
def search_patient(search:str = None,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    all_patients=search_patients(search)

    result = []
    for patients in all_patients:
        result.append({
            "patient_id":patients[0],
            "user_id":patients[1],
            "name":patients[2],
            "email":patients[3],
            "phone":patients[4],
            "dob":patients[5],
            "gender":patients[6],
            "address":patients[7],
            })
    
    return {
        "patients": result
    }


@router.get("/patients/{patient_id}")
def view_specific_patient(patient_id:int,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    result = get_specific_patient(patient_id)
    if result is None:
        raise HTTPException(status_code=404,detail="Patient not found")

    patient, appointments = result

    appointment_result = []

    for appointment in appointments:
        appointment_result.append({
            "appointment_id": appointment[0],
            "doctor_id": appointment[1],
            "doctor_name": appointment[2],
            "appointment_date": appointment[3],
            "appointment_time": appointment[4],
            "status": appointment[5],
            "reason": appointment[6]
        })
    return {
        "patient": {
            "patient_id": patient[0],
            "user_id": patient[1],
            "name": patient[2],
            "phone": patient[3],
            "dob": patient[4],
            "gender": patient[5],
            "address": patient[6],
            "email": patient[7],
            "status": patient[8]
        },
        "appointments": appointment_result
    }


@router.put("/patients/{patient_id}/status")
def change_patient_status(patient_id:int,status:str,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    status=status.capitalize()

    if status not in ["Active", "Inactive"]:
        raise HTTPException(status_code=400,detail="Status must be active or inactive")

    result, message = update_patient_status(patient_id,status)

    if message != "success":
        raise HTTPException(status_code=404,detail=message)

    return {
        "message": "Patient status updated successfully",
        "patient": result
    }


# @router.get("/appointments")
# def view_all_appointments():
#     appointments = get_all_appointments()

#     appointments_result = []

#     for appointment in appointments:
#         appointments_result.append({
#             "appointment_id": appointment[0],
#             "patient": appointment[1],
#             "doctor": appointment[2],
#             "specialization": appointment[3],
#             "date": appointment[4],
#             "time": appointment[5],
#             "reason": appointment[6],
#             "status": appointment[7]
#         })

#     return {
#         "appointments": appointments_result
#     }


@router.get("/appointments")
def view_all_appointments_with_filter(status:str = None,appointment_date:str = None,doctor_id:int = None,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    if status: 
        status = status.capitalize()
        if status not in ["Pending","Confirmed","Rejected","Completed","Cancelled"]:
            raise HTTPException(status_code=400,detail="Status must be Pending,Confirmed,Rejected,Completed or Cancelled")
    if appointment_date:
        try:
            appointment_date = datetime.strptime(appointment_date, "%d/%m/%Y").date()
        except Exception:
            raise HTTPException(status_code=400,detail="Date must be in DD/MM/YYYY format")
    appointments = get_filter_and_all_appointments(status=status,appointment_date=appointment_date,doctor_id=doctor_id)

    appointments_result = []

    for appointment in appointments:
        appointments_result.append({
            "appointment_id": appointment[0],
            "patient": appointment[1],
            "doctor": appointment[2],
            "specialization": appointment[3],
            "date": appointment[4].strftime("%d/%m/%Y"),
            "time": appointment[5],
            "reason": appointment[6],
            "status": appointment[7]
        })

    return {
        "appointments": appointments_result
    }


@router.get("/appointments/{appointment_id}")
def view_specific_appointment(appointment_id:int,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")
    
    specific_appointment = get_specific_appointment(appointment_id)

    if specific_appointment is None:
        raise HTTPException(status_code=404,detail="Appointment not found")

    return {
        "appointment_id": specific_appointment[0],
        "patient": {
            "patient_id": specific_appointment[1],
            "name": specific_appointment[2],
            "phone": specific_appointment[3]
        },
        "doctor": {
            "doctor_id": specific_appointment[4],
            "name": specific_appointment[5],
            "specialization": specific_appointment[6]
        },
        "date": specific_appointment[7],
        "time": specific_appointment[8],
        "reason": specific_appointment[9],
        "status": specific_appointment[10]
    }


@router.put("/appointments/{appointment_id}/status")
def change_appointment_status(appointment_id:int,status:str,current_user:dict=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only Admin can Access")

    status=status.capitalize()

    if status not in ["Pending","Confirmed","Rejected","Completed","Cancelled"]:
        raise HTTPException(status_code=400,detail="Status must be Pending,Confirmed,Rejected,Completed or Cancelled")

    result , message = update_appointment_status(appointment_id,status)

    if message!="success":
        raise HTTPException(status_code=404,detail=message)
    
    return{
        "message": message,
        "appointment": result
    }