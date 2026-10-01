from app.database import get_connection

# def search_doctors(specialization: str):
#     connection = get_connection()
#     cursor = connection.cursor()
    
#     cursor.execute(
#         """
#         SELECT
#             d.doctor_id,
#             d.name,
#             s.name as specialization,
#             d.phone,
#             d.qualification,
#             d.experience,
#             d.bio,
#             d.availability
#         FROM doctors d
#         JOIN specializations s
#             ON d.specialization_id = s.specialization_id
#         WHERE LOWER(s.name) = LOWER(%s)
#         ORDER BY d.name
#         """,
#         (specialization,)
#     )
    
#     doctors = cursor.fetchall()
    
#     cursor.close()
#     connection.close()
    
#     return doctors

def get_all_details():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
        (SELECT COUNT(*) FROM patients) AS total_patients,
        (SELECT COUNT(*) FROM doctors) AS total_doctors,
        (SELECT COUNT(*) FROM appointments) AS total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'Pending') AS pending_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed') AS completed_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled') AS cancelled_appointments;
        """,
    )

    result = cursor.fetchone()
        
    cursor.close()
    connection.close()

    return result

# def get_totalpatients():
#     connection = get_connection()
#     cursor = connection.cursor()

#     cursor.execute(
#         """ 
#         SELECT COUNT(*) FROM patients;
#         """,
#     )

#     totalpatients = cursor.fetchone()[0] 
        
#     cursor.close()
#     connection.close()
        
#     return totalpatients


# def get_totaldoctors():
#     connection = get_connection()
#     cursor = connection.cursor()

#     cursor.execute(
#         """ 
#         SELECT COUNT(*) FROM doctors;
#         """,
#     )

#     totaldoctors = cursor.fetchone()[0] 
        
#     cursor.close()
#     connection.close()
        
#     return totaldoctors


# def get_pendingappointments():
#     connection = get_connection()
#     cursor = connection.cursor()

#     cursor.execute(
#         """ 
#         SELECT COUNT(*) FROM appointments WHERE status = 'Pending';
#         """,
#     )

#     pendingappointments = cursor.fetchone()[0] 
        
#     cursor.close()
#     connection.close()
        
#     return pendingappointments



# def get_completedappointments():
#     connection = get_connection()
#     cursor = connection.cursor()

#     cursor.execute(
#         """ 
#         SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed';
#         """,
#     )

#     completedappointments = cursor.fetchone()[0] 
        
#     cursor.close()
#     connection.close()
        
#     return completedappointments



# def get_cancelledappointments():
#     connection = get_connection()
#     cursor = connection.cursor()

#     cursor.execute(
#         """ 
#         SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled';
#         """,
#     )

#     cancelledappointments = cursor.fetchone()[0] 
        
#     cursor.close()
#     connection.close()
        
#     return cancelledappointments

def add_doctor(
        name:str,
        email:str,
        hashed_password:str,
        phone:str,
        specialization_id:int,
        qualification:str,
        experience:str,
        bio:str,
        availability:str):
    
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
        SELECT user_id FROM users WHERE email = %s 
            """,(email,)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            connection.rollback()
            return None,"Email Already Exist"


        cursor.execute(
            """
        SELECT specialization_id FROM specializations WHERE specialization_id = %s
            """,(specialization_id,)
        )
        specialization = cursor.fetchone()

        if not specialization:
            connection.rollback()
            return None,"Specialization Not Exist"

        cursor.execute(
            """
        INSERT INTO users(username,email,password_hash,role,status) VALUES(%s,%s,%s,'doctor','Active') RETURNING user_id
            """,(name,email,hashed_password)
        )

        user_id = cursor.fetchone()[0]


        cursor.execute(
            """
        INSERT INTO doctors(user_id,specialization_id,name,phone,qualification,experience,bio,availability) VALUES(%s,%s,%s,%s,%s,%s,%s,%s) RETURNING doctor_id
            """,(user_id,specialization_id,name,phone,qualification,experience,bio,availability)
        )
        doctor_id = cursor.fetchone()[0]

        connection.commit()

        return{
            "doctor_id": doctor_id,
            "user_id": user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "specialization_id": specialization_id,
            "qualification": qualification,
            "experience": experience,
            "bio": bio,
            "availability":availability
        },"success"
    
    except Exception:
        connection.rollback()
        raise 
    finally:
        cursor.close()
        connection.close()


def get_all_doctors():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
    SELECT * FROM doctors
        """
    )
    all_doctors = cursor.fetchall()

    cursor.close()
    connection.close()

    return all_doctors


def get_specific_doctor(doctor_id:int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
    SELECT * FROM doctors WHERE doctor_id=%s
        """,(doctor_id,)
    )

    specific_doctor = cursor.fetchone()

    cursor.close()
    connection.close()
    return specific_doctor

def get_update_doctor(
        doctor_id:int,
        name:str,
        phone:str,
        specialization_id:int,
        qualification:str,
        experience:str,
        bio:str,
        availability:str):
    
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
        UPDATE doctors SET name = %s,
            phone = %s,
            specialization_id = %s, 
            qualification = %s,
            experience = %s,
            bio = %s,
            availability = %s
        WHERE doctor_id = %s
        RETURNING
            doctor_id, user_id, specialization_id, name, phone, qualification, experience, bio, availability
            """,(name,phone,specialization_id,qualification,experience,bio,availability,doctor_id,)
        )

        updated_doctor=cursor.fetchone()

        if updated_doctor is None:
            connection.rollback()
            cursor.close()
            connection.close()
            return None
        
        cursor.execute(
                """
                UPDATE users
                SET username = %s
                WHERE user_id = (SELECT user_id FROM doctors WHERE doctor_id = %s)
                """,
                (name, doctor_id)
            )

        connection.commit()

        return updated_doctor
    except Exception:
        connection.rollback()
        raise 

    finally:
        cursor.close()
        connection.close()


def update_doctor_status(doctor_id:int,status:str):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
    UPDATE users SET status = %s WHERE user_id = (SELECT user_id FROM doctors WHERE doctor_id = %s)
        """,(status,doctor_id)
    )

    if cursor.rowcount == 0:
        connection.rollback()
        cursor.close()
        connection.close()
        return None, "Doctor not found"

    connection.commit()

    cursor.close()
    connection.close()

    return {
            "doctor_id": doctor_id,
            "status": status
        }, "success"


# def get_all_patients():
#     connection = get_connection()
#     cursor = connection.cursor()

#     cursor.execute(
#         """
#     SELECT * FROM patients
#         """
#     )
#     all_patients = cursor.fetchall()

#     cursor.close()
#     connection.close()

#     return all_patients

def search_patients(search:str = None):
    connection = get_connection()
    cursor = connection.cursor()

    if search:
        cursor.execute(
             """
            SELECT
                p.patient_id,
                p.user_id,
                p.name,
                u.email,
                p.phone,
                p.dob,
                p.gender,
                p.address
            FROM patients p
            JOIN users u
                ON p.user_id = u.user_id
            WHERE
                p.name ILIKE %s
                OR u.email ILIKE %s
                OR p.phone ILIKE %s
            ORDER BY p.name
            """,(f"%{search}%",f"%{search}%",f"%{search}%")
        )
    else:
        cursor.execute(
            """
            SELECT
                p.patient_id,
                p.user_id,
                p.name,
                u.email,
                p.phone,
                p.dob,
                p.gender,
                p.address
            FROM patients p
            JOIN users u
                ON p.user_id = u.user_id
            ORDER BY p.name
            """
        )

    searched_patient = cursor.fetchall()

    cursor.close()
    connection.close()

    return searched_patient


def get_specific_patient(patient_id:int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                p.patient_id,
                p.user_id,
                p.name,
                p.phone,
                p.dob,
                p.gender,
                p.address,
                u.email,
                u.status
            FROM patients p
            JOIN users u
                ON p.user_id = u.user_id
            WHERE p.patient_id = %s
            """,
            (patient_id,)
        )

        patient = cursor.fetchone()

        if patient is None:
            return None

        cursor.execute(
            """
            SELECT
                a.appointment_id,
                a.doctor_id,
                d.name,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.reason
            FROM appointments a
            JOIN doctors d
                ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = %s
            ORDER BY
                a.appointment_date DESC,
                a.appointment_time DESC
            """,
            (patient_id,)
        )

        appointments = cursor.fetchall()

        return patient, appointments

    finally:
        cursor.close()
        connection.close()

def update_patient_status(patient_id:int,status:str):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE users SET status = %s WHERE user_id = (SELECT user_id FROM patients WHERE patient_id = %s)
        """,(status,patient_id)
    )

    if cursor.rowcount == 0:
        connection.rollback()
        cursor.close()
        connection.close()
        return None, "Patient not found"

    connection.commit()

    cursor.close()
    connection.close()

    return {
            "patient_id": patient_id,
            "status": status
        }, "success"


def get_all_appointments():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                a.appointment_id,
                p.name,
                d.name,
                s.name,
                a.appointment_date,
                a.appointment_time,
                a.reason,
                a.status
            FROM appointments a
            JOIN patients p
                ON a.patient_id = p.patient_id
            JOIN doctors d
                ON a.doctor_id = d.doctor_id
            JOIN specializations s
                ON d.specialization_id = s.specialization_id
            ORDER BY
                a.appointment_date DESC,
                a.appointment_time DESC
            """
        )

        appointments = cursor.fetchall()

        return appointments
    finally:
        cursor.close()
        connection.close()


def get_specific_appointment(appointment_id:int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
             SELECT
                a.appointment_id,
                p.patient_id,
                p.name,
                p.phone,
                d.doctor_id,
                d.name,
                s.name,
                a.appointment_date,
                a.appointment_time,
                a.reason,
                a.status
            FROM appointments a
            JOIN patients p
                ON a.patient_id = p.patient_id
            JOIN doctors d
                ON a.doctor_id = d.doctor_id
            JOIN specializations s
                ON d.specialization_id = s.specialization_id
            WHERE a.appointment_id = %s
            """,
            (appointment_id,)
        )
        specific_patient = cursor.fetchone()
        return specific_patient
    finally:
        cursor.close()
        connection.close()


def update_appointment_status(appointment_id:int,status:str):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            UPDATE appointments SET status = %s WHERE appointment_id = %s
            """,(status,appointment_id)
        )

        if cursor.rowcount==0:
            connection.rollback()
            cursor.close()
            connection.close()
            return None,"Appoinment not found"

        connection.commit()
        return {
                "appointment_id": appointment_id,
                "status": status
            }, "success"
    except:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

        