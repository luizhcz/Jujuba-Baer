import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MODEL_NAME = os.getenv('MODEL_NAME')
    DATABASE_URI = 'sqlite:///conversas.db'