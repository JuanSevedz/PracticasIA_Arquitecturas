# EDA CRUD - Python + MySQL

CRUD basado en Event-Driven Architecture. CUD publica `UserCreated`, `UserUpdated` y `UserDeleted` en un broker `queue.Queue`; un consumer asíncrono persiste en MySQL. READ consulta MySQL síncronamente.

## Ejecutar
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
mysql -u root -p < sql/schema.sql
python app.py
```

API: `http://localhost:5000`

## Pruebas
```bash
curl -X POST http://localhost:5000/users -H 'Content-Type: application/json' -d '{"nombre":"Juan","email":"juan@example.com"}'
curl http://localhost:5000/users
curl -X PUT http://localhost:5000/users/1 -H 'Content-Type: application/json' -d '{"nombre":"Juan Sebastian","email":"juan@example.com"}'
curl -X DELETE http://localhost:5000/users/1
```

POST/PUT/DELETE devuelven `202 Accepted`: la mutación queda representada por un evento y la persistencia la realiza el consumer. Puede existir consistencia eventual. GET es síncrono contra el modelo de lectura MySQL.
