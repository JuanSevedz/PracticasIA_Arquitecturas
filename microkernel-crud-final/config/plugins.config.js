/**
 * config/plugins.config.js
 * -----------------------------------------------------------------------
 * Define QUÉ plugins carga el Kernel y con qué opciones.
 * Agregar un plugin nuevo al sistema = agregar una entrada aquí,
 * sin tocar el núcleo.
 * -----------------------------------------------------------------------
 */

require('dotenv').config();

module.exports = [
  {
    name: 'mysql-db',
    path: 'plugins/mysql-plugin',
    options: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'microkernel_crud',
      connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
    },
  },
  {
    name: 'productos-crud',
    path: 'plugins/productos-crud-plugin',
    options: {
      dbPluginName: 'mysql-db', // le indica al plugin CRUD qué plugin de datos usar
    },
  },
];
