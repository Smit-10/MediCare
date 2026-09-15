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