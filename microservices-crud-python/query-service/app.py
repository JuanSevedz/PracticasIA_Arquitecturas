import os
from contextlib import closing
import mysql.connector
from fastapi import FastAPI, HTTPException
app=FastAPI(title="Query Service",description="Microservicio independiente de Read")
def db(): return mysql.connector.connect(host=os.getenv("DB_HOST","mysql"),port=int(os.getenv("DB_PORT","3306")),database=os.getenv("DB_NAME","microservices_crud"),user=os.getenv("DB_USER","app_user"),password=os.getenv("DB_PASSWORD","app_password"))
@app.get("/health")
def health(): return {"service":"query-service","status":"ok"}
@app.get("/users")
def users():
    try:
        with closing(db()) as c, closing(c.cursor(dictionary=True)) as cur:
            cur.execute("SELECT id,nombre,email,creado_en,actualizado_en FROM users ORDER BY id"); return cur.fetchall()
    except mysql.connector.Error as e: raise HTTPException(500,f"Error de base de datos: {e}")
@app.get("/users/{user_id}")
def user(user_id:int):
    try:
        with closing(db()) as c, closing(c.cursor(dictionary=True)) as cur:
            cur.execute("SELECT id,nombre,email,creado_en,actualizado_en FROM users WHERE id=%s",(user_id,)); row=cur.fetchone()
            if row is None: raise HTTPException(404,"Usuario no encontrado")
            return row
    except HTTPException: raise
    except mysql.connector.Error as e: raise HTTPException(500,f"Error de base de datos: {e}")
