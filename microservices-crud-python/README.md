# Microservices CRUD - Python + Docker Compose

## Arquitectura

```text
Cliente
  ├── :8001 → User Service → CREATE / UPDATE / DELETE
  └── :8002 → Query Service → READ
                       \      /
                        MySQL
```

Cada microservicio es un proceso/contenedor independiente. Docker Compose orquesta MySQL y ambos servicios.

## Arranque

```bash
docker compose up --build
```

Swagger:
- User Service: http://localhost:8001/docs
- Query Service: http://localhost:8002/docs

## Pruebas

Crear:
```bash
curl -X POST http://localhost:8001/users -H 'Content-Type: application/json' -d '{"nombre":"Juan","email":"juan@example.com"}'
```

Leer:
```bash
curl http://localhost:8002/users
```

Actualizar:
```bash
curl -X PUT http://localhost:8001/users/1 -H 'Content-Type: application/json' -d '{"nombre":"Juan Sebastián","email":"juan@example.com"}'
```

Eliminar:
```bash
curl -X DELETE http://localhost:8001/users/1
```

MySQL está publicado en el host como `localhost:3307`, pero desde los servicios se accede mediante hostname `mysql` y puerto `3306`.

El healthcheck de MySQL y `depends_on: condition: service_healthy` evitan que los servicios Python arranquen antes de que MySQL esté listo.

> Nota arquitectónica: ambos servicios comparten MySQL porque es un requisito de este prototipo. En una arquitectura de microservicios más estricta se puede evaluar autonomía de datos por servicio.
