import os
from contextlib import closing
import mysql.connector
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr

app = FastAPI(title="User Service", description="Microservicio de Create, Update y Delete")
class UserInput(BaseModel):
    nombre: str
    email: EmailStr

def db():
    return mysql.connector.connect(host=os.getenv("DB_HOST","mysql"),port=int(os.getenv("DB_PORT","3306")),database=os.getenv("DB_NAME","microservices_crud"),user=os.getenv("DB_USER","app_user"),password=os.getenv("DB_PASSWORD","app_password"))

@app.get("/health")
def health(): return {"service":"user-service","status":"ok"}

@app.post("/users", status_code=status.HTTP_201_CREATED)
def create(user: UserInput):
    try:
        with closing(db()) as c, closing(c.cursor()) as cur:
            cur.execute("INSERT INTO users (nombre,email) VALUES (%s,%s)",(user.nombre,user.email)); c.commit()
            return {"message":"Usuario creado","id":cur.lastrowid,**user.model_dump()}
    except mysql.connector.Error as e:
        if getattr(e,"errno",None)==1062: raise HTTPException(409,"El email ya existe")
        raise HTTPException(500,f"Error de base de datos: {e}")

@app.put("/users/{user_id}")
def update(user_id:int,user:UserInput):
    try:
        with closing(db()) as c, closing(c.cursor()) as cur:
            cur.execute("UPDATE users SET nombre=%s,email=%s WHERE id=%s",(user.nombre,user.email,user_id))
            if cur.rowcount==0: raise HTTPException(404,"Usuario no encontrado")
            c.commit(); return {"message":"Usuario actualizado","id":user_id}
    except HTTPException: raise
    except mysql.connector.Error as e:
        if getattr(e,"errno",None)==1062: raise HTTPException(409,"El email ya existe")
        raise HTTPException(500,f"Error de base de datos: {e}")

@app.delete("/users/{user_id}")
def delete(user_id:int):
    try:
        with closing(db()) as c, closing(c.cursor()) as cur:
            cur.execute("DELETE FROM users WHERE id=%s",(user_id,))
            if cur.rowcount==0: raise HTTPException(404,"Usuario no encontrado")
            c.commit(); return {"message":"Usuario eliminado","id":user_id}
    except HTTPException: raise
    except mysql.connector.Error as e: raise HTTPException(500,f"Error de base de datos: {e}")
