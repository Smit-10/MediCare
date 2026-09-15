from app.database import get_connection

def create_patient(user_id, name, phone, dob, gender, address):
    connection = get_connection()
    cursor = connection.cursor()
    
    cursor.execute(
        """
        SELECT patient_id FROM patients
        WHERE user_id = %s
        """,
        (user_id,)
    )
    
    existing_patient = cursor.fetchone()
    
    if existing_patient:
        cursor.close()
        connection.close()
        return None
    
    cursor.execute(
        """
        INSERT INTO patients
        (user_id, name, phone, dob, gender, address)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING patient_id, user_id, name, phone, dob, gender, address
        """,
        (user_id, name, phone, dob, gender, address)
    )
    
    patient = cursor.fetchone()
    
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return patient

def get_patient(user_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
        patient_id, user_id, name, phone, dob, gender, address
        FROM patients
        WHERE user_id = %s
        """,
        (user_id,)
    )

    patient = cursor.fetchone()

    cursor.close()
    connection.close()

    return patient

def update_patient(user_id, name, phone, dob, gender, address):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE patients
        SET name = %s, phone = %s, dob = %s, gender = %s, address = %s
        WHERE user_id = %s
        RETURNING patient_id, user_id, name, phone, dob, gender, address
        """,
        (name, phone, dob, gender, address, user_id)
    )

    patient = cursor.fetchone()

    connection.commit()

    cursor.close()
    connection.close()

    return patient