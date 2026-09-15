import psycopg
from app.config import DATABASE_URL

def get_connection():
    connection = psycopg.connect(DATABASE_URL)
    return connection