# Microkernel CRUD — Node.js + MySQL

Prototipo académico de un sistema CRUD utilizando **arquitectura Microkernel / Plugin Architecture**.

> Este proyecto **no es una arquitectura de microservicios**. Es una sola aplicación cuyo núcleo (Kernel) administra plugins.

## 1. Arquitectura

```text
Navegador
    │
    ▼
Express / HTTP
    │
    ▼
┌─────────────────────────────┐
│           KERNEL            │
│                             │
│ PluginInterface             │
│ PluginManager               │
│ kernel.execute()            │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
productos-crud       mysql-db
       │                │
       └───────┬────────┘
               ▼
             MySQL
```

### Responsabilidades

- **Kernel:** carga plugins, administra su ciclo de vida y ofrece `execute()`.
- **PluginInterface:** define `init()`, `execute()` y `destroy()`.
- **PluginManager:** carga dinámicamente los plugins desde `config/plugins.config.js`.
- **mysql-db:** administra el pool de conexiones MySQL.
- **productos-crud:** implementa Create, Read, Update y Delete.
- **Express:** únicamente traduce HTTP a llamadas al Kernel.
- **public/index.html:** interfaz visual para demostrar el patrón desde el navegador.

## 2. Estructura

```text
microkernel-crud/
├── kernel/
│   ├── PluginInterface.js
│   ├── PluginManager.js
│   └── Kernel.js
│
├── plugins/
│   ├── mysql-plugin/
│   │   └── index.js
│   └── productos-crud-plugin/
│       └── index.js
│
├── config/
│   └── plugins.config.js
│
├── sql/
│   └── schema.sql
│
├── public/
│   └── index.html
│
├── server.js
├── .env.example
├── .gitignore
└── package.json
```

## 3. Instalación

Requisitos:

- Node.js 18 o superior
- MySQL 8.x (o compatible)
- npm

Instalar dependencias:

```bash
npm install
```

Crear `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Editar las credenciales:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=microkernel_crud
DB_POOL_LIMIT=10

PORT=3000
NODE_ENV=development
```

Crear la base de datos y tabla:

```bash
mysql -u root -p < sql/schema.sql
```

## 4. Ejecutar

```bash
npm start
```

También existe:

```bash
npm run dev
```

para desarrollo con `node --watch`.

Abrir:

```text
http://localhost:3000
```

o:

```text
http://localhost:3000/demo
```

## 5. Demostración para la sustentación

La página `/demo` permite mostrar:

1. El navegador enviando solicitudes HTTP.
2. Express recibiendo las solicitudes.
3. El Kernel como núcleo del sistema.
4. Los plugins registrados.
5. El plugin `productos-crud`.
6. El plugin `mysql-db`.
7. La conexión con MySQL.
8. El CRUD de productos.

La idea principal para explicar es:

> El Kernel no contiene lógica de productos ni código específico de MySQL. Su función es cargar, inicializar, ejecutar y destruir plugins. La funcionalidad se incorpora mediante plugins que cumplen el contrato definido por `PluginInterface`.

### Flujo de un CREATE

```text
POST /api/productos
       │
       ▼
    Express
       │
       ▼
kernel.execute(
    "productos-crud",
    "create",
    payload
)
       │
       ▼
ProductosCrudPlugin
       │
       ▼
kernel.execute(
    "mysql-db",
    "query",
    { sql, params }
)
       │
       ▼
MySQLPlugin
       │
       ▼
Pool mysql2
       │
       ▼
MySQL
```

## 6. Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/` | Interfaz de demostración |
| GET | `/demo` | Interfaz de demostración |
| GET | `/api/_kernel/plugins` | Lista plugins registrados |
| GET | `/api/_kernel/status` | Estado del Kernel y plugins |
| GET | `/api/productos` | Listar productos |
| GET | `/api/productos/:id` | Buscar producto |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto |

## 7. Ejemplo de creación

```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Teclado mecánico","precio":149.90,"stock":25}'
```

## 8. Punto importante del patrón

Para agregar otro módulo, por ejemplo:

```text
plugins/clientes-crud-plugin/
```

se implementaría `PluginInterface`, se agregaría a `config/plugins.config.js` y el Kernel podría cargarlo sin modificar su código.

Esto demuestra la idea central de la arquitectura:

**núcleo estable + funcionalidades extensibles mediante plugins.**

## 9. Nota sobre MySQL

El servidor HTTP puede arrancar aunque MySQL esté temporalmente apagado. En ese caso `/demo` seguirá disponible y mostrará el estado de MySQL.

Las operaciones CRUD requieren que MySQL esté funcionando y que la base de datos configurada en `.env` exista.

Esto evita que una falla de infraestructura impida demostrar visualmente el funcionamiento del Kernel y del sistema de plugins.
