/**
 * server.js
 * Punto de entrada HTTP del sistema.
 *
 * Express es únicamente la capa de transporte:
 * Browser -> HTTP -> Kernel -> Plugin CRUD -> Plugin MySQL -> MySQL
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const Kernel = require('./kernel/Kernel');
const pluginsConfig = require('./config/plugins.config');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const kernel = new Kernel({
  pluginsConfig,
  globalConfig: { env: process.env.NODE_ENV || 'development' },
  logger: console,
});

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/* =========================
   DEMO / DOCUMENTACIÓN
   ========================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* =========================
   API DEL KERNEL
   ========================= */

app.get('/api/_kernel/plugins', (req, res) => {
  res.json({
    booted: kernel.booted,
    plugins: kernel.pluginManager.list(),
  });
});

app.get('/api/_kernel/status', asyncHandler(async (req, res) => {
  const plugins = [];

  for (const [name, plugin] of kernel.pluginManager.getAll()) {
    const item = {
      name,
      initialized: plugin.initialized,
    };

    // El plugin MySQL expone una acción de diagnóstico.
    if (name === 'mysql-db' && plugin.initialized) {
      try {
        item.database = await plugin.execute('status');
      } catch (err) {
        item.database = {
          connected: false,
          error: err.message,
        };
      }
    }

    plugins.push(item);
  }

  res.json({
    kernel: {
      booted: kernel.booted,
    },
    plugins,
    architecture: [
      'HTTP / Browser',
      'Kernel',
      'productos-crud',
      'mysql-db',
      'MySQL',
    ],
  });
}));

/* =========================
   CRUD PRODUCTOS
   ========================= */

app.post('/api/productos', asyncHandler(async (req, res) => {
  const producto = await kernel.execute(
    'productos-crud',
    'create',
    req.body
  );
  res.status(201).json(producto);
}));

app.get('/api/productos', asyncHandler(async (req, res) => {
  const { limit, offset } = req.query;
  const productos = await kernel.execute(
    'productos-crud',
    'findAll',
    { limit, offset }
  );
  res.json(productos);
}));

app.get('/api/productos/:id', asyncHandler(async (req, res) => {
  const producto = await kernel.execute(
    'productos-crud',
    'findById',
    { id: req.params.id }
  );
  res.json(producto);
}));

app.put('/api/productos/:id', asyncHandler(async (req, res) => {
  const producto = await kernel.execute(
    'productos-crud',
    'update',
    { id: req.params.id, ...req.body }
  );
  res.json(producto);
}));

app.delete('/api/productos/:id', asyncHandler(async (req, res) => {
  const result = await kernel.execute(
    'productos-crud',
    'delete',
    { id: req.params.id }
  );
  res.json(result);
}));

/* =========================
   ERRORES
   ========================= */

app.use((err, req, res, next) => {
  console.error('[HTTP Error]', err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.message,
  });
});

/* =========================
   ARRANQUE / APAGADO
   ========================= */

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    // El Kernel se inicializa antes de aceptar peticiones.
    await kernel.boot();

    app.listen(PORT, () => {
      console.log('');
      console.log('==============================================');
      console.log('       MICROKERNEL CRUD - SERVIDOR');
      console.log('==============================================');
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`Demo:     http://localhost:${PORT}/demo`);
      console.log(`API:      http://localhost:${PORT}/api/productos`);
      console.log('==============================================');
      console.log('');
    });
  } catch (err) {
    console.error('[server] Error crítico al arrancar:', err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n[server] ${signal} recibido. Apagando...`);
  await kernel.shutdown();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
