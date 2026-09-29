import os
from dotenv import load_dotenv
load_dotenv()
class Config:
    DB_HOST=os.getenv('DB_HOST','localhost'); DB_PORT=int(os.getenv('DB_PORT','3306'))
    DB_USER=os.getenv('DB_USER','eda_user'); DB_PASSWORD=os.getenv('DB_PASSWORD','eda_password')
    DB_NAME=os.getenv('DB_NAME','eda_crud'); PORT=int(os.getenv('PORT','5000'))
