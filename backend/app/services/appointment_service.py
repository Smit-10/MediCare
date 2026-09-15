from app.database import get_connection
from datetime import datetime

def get_patient_id(user_id: int):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT patient_id
        FROM patients
        WHERE user_id=%s
        """,
        (user_id,)
    )
    
    patient = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    if patient is None:
        return None
    
    return patient[0]

def check_doctor_availability(availability: str, appointment_date, appointment_time):
    parts = availability.split(",")
    
    days = parts[0].strip()
    time_range = parts[1].strip()
    
    start_time_text, end_time_text = time_range.split("-")
    
    start_time = datetime.strptime(
        start_time_text.strip(),
        "%I:%M %p"
    ).time()
    
    end_time = datetime.strptime(
        end_time_text.strip(),
        "%I:%M %p"
    ).time()
    
    day_name = appointment_date.strftime("%A")
    
    # check day
    if "Monday to Friday" in days:
        allowed_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    elif "Monday to Saturday" in days:
        allowed_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    
    else:
        return False
    
    if day_name not in allowed_days:
        return False
    
    # check time
    if appointment_time < start_time:
        return False
    
    if appointment_time > end_time:
        return False
    
    return True


def book_appointment(user_id: int, doctor_id: int, appointment_date, appointment_time, reason: str):
    patient_id = get_patient_id(user_id)
    
    if patient_id is None:
        return None, "patient_not_found"
    
    connection = get_connection()
    cursor = connection.cursor()
    
    # check whether doctor exists
    cursor.execute(
        """
        SELECT doctor_id, availability FROM doctors
        WHERE doctor_id=%s
        """,
        (doctor_id,)
    )
    
    doctor = cursor.fetchone()
    
    if doctor is None:
        cursor.close()
        connection.close()
        return None, "doctor_not_found"
    
    # checking doctor's working day and time
    doctor_available = check_doctor_availability(doctor[1], appointment_date, appointment_time)
    
    if not doctor_available:
        cursor.close()
        connection.close()
        
        return None, "doctor_not_available"
    
    # checking whether the selected slot is already booked
    cursor.execute(
        """
        SELECT appointment_id FROM appointments
        WHERE doctor_id = %s
            AND appointment_date = %s
            AND appointment_time = %s
            AND status IN ('Pending', 'Confirmed')
        """,
        (doctor_id, appointment_date, appointment_time)
    )
    
    existing_appointment = cursor.fetchone()
    
    if existing_appointment:
        cursor.close()
        connection.close()
        return None, "slot_not_available"
    
    # create appointment
    cursor.execute(
        """
        INSERT INTO appointments
        (patient_id, doctor_id, appointment_date, appointment_time, status, reason)
        VALUES (%s, %s, %s, %s, 'Pending', %s)
        RETURNING appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_at, updated_at
        """,
        (patient_id, doctor_id, appointment_date, appointment_time, reason)
    )
    
    appointment = cursor.fetchone()
    
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return appointment, "success"


def get_patient_appointments(user_id: int):
    patient_id = get_patient_id(user_id)

    if patient_id is None:
        return None

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            a.appointment_id,
            a.doctor_id,
            d.name AS doctor_name,
            s.name AS specialization,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,
            a.created_at,
            a.updated_at
        FROM appointments a
        JOIN doctors d
            ON a.doctor_id = d.doctor_id
        JOIN specializations s
            ON d.specialization_id = s.specialization_id
        WHERE a.patient_id = %s
        ORDER BY
            a.appointment_date DESC,
            a.appointment_time DESC
        """,
        (patient_id,)
    )

    appointments = cursor.fetchall()

    cursor.close()
    connection.close()

    return appointments


def reschedule_appointment(user_id: int, appointment_id: int, appointment_date, appointment_time):
    patient_id = get_patient_id(user_id)

    if patient_id is None:
        return None, "patient_not_found"

    connection = get_connection()
    cursor = connection.cursor()

    # Check appointment belongs to this patient
    cursor.execute(
        """
        SELECT appointment_id, doctor_id, status
        FROM appointments
        WHERE appointment_id = %s
          AND patient_id = %s
        """,
        (
            appointment_id,
            patient_id
        )
    )

    appointment = cursor.fetchone()

    if appointment is None:
        cursor.close()
        connection.close()

        return None, "appointment_not_found"

    doctor_id = appointment[1]
    status = appointment[2]

    # Check appointment status
    if status in ("Completed", "Cancelled", "Rejected"):
        cursor.close()
        connection.close()

        return None, "cannot_reschedule"

    # Get doctor's availability
    cursor.execute(
        """
        SELECT availability
        FROM doctors
        WHERE doctor_id = %s
        """,
        (doctor_id,)
    )

    doctor = cursor.fetchone()

    if doctor is None:
        cursor.close()
        connection.close()

        return None, "doctor_not_found"

    # Check doctor's availability
    doctor_available = check_doctor_availability(
        doctor[0],
        appointment_date,
        appointment_time
    )

    if not doctor_available:
        cursor.close()
        connection.close()

        return None, "doctor_not_available"

    # Check whether new slot is already booked
    cursor.execute(
        """
        SELECT appointment_id
        FROM appointments
        WHERE doctor_id = %s
          AND appointment_date = %s
          AND appointment_time = %s
          AND appointment_id != %s
          AND status IN ('Pending', 'Confirmed')
        """,
        (doctor_id, appointment_date, appointment_time, appointment_id)
    )

    existing_appointment = cursor.fetchone()

    if existing_appointment:
        cursor.close()
        connection.close()

        return None, "slot_not_available"

    # Update appointment
    cursor.execute(
        """
        UPDATE appointments
        SET
            appointment_date = %s,
            appointment_time = %s,
            status = 'Pending',
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = %s
          AND patient_id = %s
        RETURNING
            appointment_id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            reason,
            created_at,
            updated_at
        """,
        (appointment_date, appointment_time, appointment_id, patient_id)
    )

    updated_appointment = cursor.fetchone()

    connection.commit()

    cursor.close()
    connection.close()

    return updated_appointment, "success"


def cancel_appoinment(user_id: int, appointment_id: int):
    patient_id = get_patient_id(user_id)
    
    if patient_id is None:
        return None, "patient_not_found"
    
    connection = get_connection()
    cursor = connection.cursor()
    
    # checking appointment belongs to the patient
    cursor.execute(
        """
        SELECT appointment_id, status FROM appointments
        WHERE appointment_id = %s AND patient_id = %s
        """,
        (appointment_id, patient_id)
    )
    
    appointment = cursor.fetchone()
    
    if appointment is None:
        cursor.close()
        connection.close()
        
        return None, "appointment_not_found"
    
    status = appointment[1]
    
    # Check whether appointment is cancelled
    if status in ('Completed', 'Cancelled', 'Rejection'):
        cursor.close()
        connection.close()
        
        return None, "cannot_cancel"
    
    # Cancel appointment
    cursor.execute(
        """
        UPDATE appointments
        SET
            status = 'Cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = %s AND patient_id = %s
        RETURNING
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        status,
        reason,
        created_at,
        updated_at
        """,
        (appointment_id, patient_id)
    )
    
    cancelled_appointment = cursor.fetchone()
    
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return cancelled_appointment, "success"