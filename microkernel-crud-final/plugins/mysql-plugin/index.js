/**
 * Plugin de infraestructura MySQL.
 *
 * Responsabilidad:
 * - Crear y administrar el pool mysql2/promise.
 * - Exponer operaciones de acceso a datos al resto de plugins.
 * - Liberar el pool durante shutdown.
 *
 * El servidor puede levantar aunque MySQL esté temporalmente apagado.
 * Las operaciones CRUD informarán claramente cuando la BD no esté disponible.
 */

const mysql = require('mysql2/promise');
const PluginInterface = require('../../kernel/PluginInterface');

class MySQLPlugin extends PluginInterface {
  constructor(options = {}) {
    super('mysql-db');
    this.options = options;
    this.pool = null;
    this.connected = false;
    this.lastError = null;
  }

  async init(context) {
    this.logger = context.logger;

    this.pool = mysql.createPool({
      host: this.options.host,
      port: this.options.port,
      user: this.options.user,
      password: this.options.password,
      database: this.options.database,
      waitForConnections: true,
      connectionLimit: this.options.connectionLimit || 10,
      queueLimit: 0,
      decimalNumbers: true,
    });

    // Intentamos comprobar la BD, pero no impedimos que el servidor web
    // arranque. Esto permite mostrar la arquitectura desde /demo incluso
    // cuando MySQL todavía no está iniciado.
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.connected = true;
      this.lastError = null;

      this.logger.log(
        `[mysql-db] Conectado a MySQL en ${this.options.host}:${this.options.port}/${this.options.database}`
      );
    } catch (err) {
      this.connected = false;
      this.lastError = err.message;

      this.logger.warn(
        `[mysql-db] MySQL no está disponible todavía: ${err.message}`
      );
      this.logger.warn(
        '[mysql-db] El servidor HTTP continuará activo. Los CRUD requieren que MySQL esté disponible.'
      );
    }
  }

  async execute(action, payload = {}) {
    switch (action) {
      case 'query':
        return this._query(payload.sql, payload.params);

      case 'status':
        return this._status();

      default:
        throw new Error(`[mysql-db] Acción "${action}" no soportada.`);
    }
  }

  async _status() {
    if (!this.pool) {
      return {
        connected: false,
        error: 'Pool no inicializado.',
      };
    }

    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.connected = true;
      this.lastError = null;

      return {
        connected: true,
        host: this.options.host,
        port: this.options.port,
        database: this.options.database,
        poolLimit: this.options.connectionLimit || 10,
      };
    } catch (err) {
      this.connected = false;
      this.lastError = err.message;

      return {
        connected: false,
        host: this.options.host,
        port: this.options.port,
        database: this.options.database,
        error: err.message,
      };
    }
  }

  async _query(sql, params = []) {
    if (!sql) {
      throw new Error('[mysql-db] "sql" es requerido.');
    }

    if (!this.pool) {
      throw new Error('[mysql-db] El pool no está inicializado.');
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      this.connected = true;
      this.lastError = null;
      return rows;
    } catch (err) {
      this.connected = false;
      this.lastError = err.message;
      throw new Error(`[mysql-db] Error ejecutando query: ${err.message}`);
    }
  }

  async destroy() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
      this.logger?.log('[mysql-db] Pool de conexiones cerrado.');
    }
  }
}

module.exports = MySQLPlugin;
