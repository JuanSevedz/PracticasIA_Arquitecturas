/**
 * plugins/productos-crud-plugin/index.js
 * -----------------------------------------------------------------------
 * Plugin de NEGOCIO: implementa las operaciones CRUD para la entidad
 * "Productos" (id, nombre, precio, stock).
 *
 * No accede a MySQL directamente: delega en el plugin "mysql-db" a
 * través del kernel (context.kernel.execute(...)). Esto desacopla la
 * lógica de negocio del motor de base de datos concreto — si mañana
 * se reemplaza mysql-plugin por otro (ej: postgres-plugin), este
 * plugin CRUD no cambia, siempre que el nuevo plugin exponga la misma
 * acción "query".
 * -----------------------------------------------------------------------
 */

const PluginInterface = require('../../kernel/PluginInterface');

const TABLE = 'productos';

class ProductosCrudPlugin extends PluginInterface {
  constructor(options = {}) {
    super('productos-crud');
    this.dbPluginName = options.dbPluginName || 'mysql-db';
    this.kernel = null;
  }

  async init(context) {
    this.logger = context.logger;
    this.kernel = context.kernel;

    if (!this.kernel.pluginManager.has(this.dbPluginName)) {
      throw new Error(
        `[productos-crud] El plugin de datos "${this.dbPluginName}" no está registrado.`
      );
    }
    this.logger.log(`[productos-crud] Usará el plugin de datos "${this.dbPluginName}".`);
  }

  /**
   * Acciones soportadas: create | findAll | findById | update | delete
   */
  async execute(action, payload = {}) {
    switch (action) {
      case 'create':
        return this._create(payload);
      case 'findAll':
        return this._findAll(payload);
      case 'findById':
        return this._findById(payload);
      case 'update':
        return this._update(payload);
      case 'delete':
        return this._delete(payload);
      default:
        throw new Error(`[productos-crud] Acción "${action}" no soportada.`);
    }
  }

  /** Atajo interno para delegar queries al plugin de base de datos */
  async _db(sql, params) {
    return this.kernel.execute(this.dbPluginName, 'query', { sql, params });
  }

  _validate({ nombre, precio, stock }, { partial = false } = {}) {
    if (!partial || nombre !== undefined) {
      if (!nombre || typeof nombre !== 'string') {
        throw new Error('El campo "nombre" es requerido y debe ser texto.');
      }
    }
    if (!partial || precio !== undefined) {
      if (precio === undefined || isNaN(Number(precio)) || Number(precio) < 0) {
        throw new Error('El campo "precio" es requerido y debe ser un número >= 0.');
      }
    }
    if (!partial || stock !== undefined) {
      if (stock === undefined || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
        throw new Error('El campo "stock" es requerido y debe ser un entero >= 0.');
      }
    }
  }

  // ---------------------- CREATE ----------------------
  async _create({ nombre, precio, stock }) {
    this._validate({ nombre, precio, stock });
    const result = await this._db(
      `INSERT INTO ${TABLE} (nombre, precio, stock) VALUES (?, ?, ?)`,
      [nombre, precio, stock]
    );
    return this._findById({ id: result.insertId });
  }

  // ---------------------- READ (all, con paginación simple) ----------------------
  async _findAll({ limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(Number(limit) || 50, 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    return this._db(
      `SELECT id, nombre, precio, stock FROM ${TABLE} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [safeLimit, safeOffset]
    );
  }

  // ---------------------- READ (by id) ----------------------
  async _findById({ id }) {
    if (!id) throw new Error('El campo "id" es requerido.');
    const rows = await this._db(
      `SELECT id, nombre, precio, stock FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      const err = new Error(`Producto con id ${id} no encontrado.`);
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  // ---------------------- UPDATE ----------------------
  async _update({ id, nombre, precio, stock }) {
    if (!id) throw new Error('El campo "id" es requerido.');
    this._validate({ nombre, precio, stock }, { partial: true });

    // Aseguramos que exista antes de actualizar (lanza 404 si no)
    await this._findById({ id });

    const fields = [];
    const params = [];
    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
    if (precio !== undefined) { fields.push('precio = ?'); params.push(precio); }
    if (stock !== undefined) { fields.push('stock = ?'); params.push(stock); }

    if (fields.length === 0) {
      throw new Error('Debe enviar al menos un campo para actualizar (nombre, precio o stock).');
    }

    params.push(id);
    await this._db(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, params);
    return this._findById({ id });
  }

  // ---------------------- DELETE ----------------------
  async _delete({ id }) {
    if (!id) throw new Error('El campo "id" es requerido.');
    await this._findById({ id }); // valida existencia (404 si no existe)
    await this._db(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    return { deleted: true, id: Number(id) };
  }

  async destroy() {
    // Este plugin no mantiene recursos propios (usa el pool de mysql-db),
    // por lo que no hay nada que liberar aquí.
    this.logger?.log('[productos-crud] Plugin finalizado.');
  }
}

module.exports = ProductosCrudPlugin;
