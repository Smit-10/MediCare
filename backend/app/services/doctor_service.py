from app.database import get_connection

def search_doctors(specialization: str):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT
            d.doctor_id,
            d.name,
            s.name as specialization,
            d.phone,
            d.qualification,
            d.experience,
            d.bio,
            d.availability
        FROM doctors d
        JOIN specializations s
            ON d.specialization_id = s.specialization_id
        WHERE LOWER(s.name) = LOWER(%s)
        ORDER BY d.name
        """,
        (specialization,)
    )
    
    doctors = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return doctors

def get_doctor_id(user_id: int):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT doctor_id FROM doctors WHERE user_id = %s
        """,
        (user_id,)
    )
    
    doctor = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    if doctor is None:
        return None
    
    return doctor[0]


def get_doctor_profile(user_id: int):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT
            d.doctor_id,
            d.user_id,
            d.name,
            d.phone,
            d.qualification,
            d.experience,
            d.bio,
            d.availability,
            s.specialization_id,
            s.name AS specialization
        FROM doctors d
        JOIN specializations s
            ON d.specialization_id = s.specialization_id
        WHERE d.user_id = %s
        """,
        (user_id,)
    )
    
    doctor = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    return doctor


def update_doctor_profile(
    user_id: int,
    name: str,
    phone: str,
    qualification: str,
    experience: int,
    bio: str
):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        UPDATE doctors
        SET
            name = %s,
            phone = %s,
            qualification = %s,
            experience = %s,
            bio = %s
        WHERE user_id = %s
        RETURNING
            doctor_id, user_id, name, phone, qualification, experience, bio, availability
        """,
        (name, phone, qualification, experience, bio, user_id)
    )
    
    doctor = cursor.fetchone()
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return doctor


def get_doctor_appointments(user_id: int):
    doctor_id = get_doctor_id(user_id)
    
    if doctor_id is None:
        return None
    
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT
            a.appointment_id,
            a.patient_id,
            p.name as patient_name,
            p.phone as patient_phone,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,
            a.created_at,
            a.updated_at
        FROM appointments a
        JOIN patients p
            ON a.patient_id = p.patient_id
        WHERE a.doctor_id = %s
        ORDER BY
            a.appointment_date ASC,
            a.appointment_time ASC
        """,
        (doctor_id,)
    )
    
    appointments = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return appointments


def update_appointment_status(user_id: int, appointment_id: int, new_status: str):
    doctor_id = get_doctor_id(user_id)
    
    if doctor_id is None:
        return None, "doctor_not_found"
    
    connection = get_connection()
    cursor = connection.cursor()
    
    # checking apppointment belongs to this doctor
    cursor.execute(
        """
        SELECT appointment_id, status
        FROM appointments
        WHERE appointment_id = %s AND doctor_id = %s
        """,
        (appointment_id, doctor_id)
    )
    
    appointment = cursor.fetchone()
    
    if appointment is None:
        cursor.close()
        connection.close()
        
        return None, 'appointment_not_found'
    
    current_status = appointment[1]
    
    # doctor can accept or reject only pending appointments
    if current_status != 'Pending':
        cursor.close()
        connection.close()
        
        return None, 'invalid_status'
    
    # updating appointment status
    cursor.execute(
        """
        UPDATE appointments
        SET
            status = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = %s AND doctor_id = %s
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
        (new_status, appointment_id, doctor_id)
    )
    
    updated_appointment = cursor.fetchone()
    
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return updated_appointment, 'success'


def update_doctor_availability(user_id: int, availability):
    doctor_id = get_doctor_id(user_id)
    
    if doctor_id is None:
        return None, "doctor_not_found"
    
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        UPDATE doctors
        SET
            availability = %s
        WHERE doctor_id = %s
        RETURNING doctor_id, availability
        """,
        (availability, doctor_id)
    )
    
    doctor = cursor.fetchone()
    
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return doctor, "success"