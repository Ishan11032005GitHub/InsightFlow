import os

class DatabaseConfig:
    """Mock database config for InsightsFlow"""
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASS = os.getenv('DB_PASS', 'postgres')
    DB_NAME = os.getenv('DB_NAME', 'insightflow_db')

    @classmethod
    def get_connection_string(cls):
        return f"postgresql://{cls.DB_USER}:{cls.DB_PASS}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"

db_config = DatabaseConfig()
