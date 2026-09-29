/**
 * kernel/PluginManager.js
 * -----------------------------------------------------------------------
 * Responsable exclusivamente de:
 *  - Cargar plugins dinámicamente (require) a partir de una configuración.
 *  - Validar que cumplan el contrato PluginInterface.
 *  - Mantener un registro (Map) accesible por nombre.
 *
 * No contiene lógica de negocio: es infraestructura pura del núcleo.
 * -----------------------------------------------------------------------
 */

const path = require('path');
const PluginInterface = require('./PluginInterface');

class PluginManager {
  constructor(logger = console) {
    /** @type {Map<string, PluginInterface>} */
    this.registry = new Map();
    this.logger = logger;
  }

  /**
   * Carga dinámicamente un plugin desde su ruta y lo instancia.
   * @param {object} pluginConfig { name, path, options }
   * @returns {PluginInterface}
   */
  loadPlugin(pluginConfig) {
    const { name, path: pluginPath, options = {} } = pluginConfig;

    if (this.registry.has(name)) {
      throw new Error(`[PluginManager] El plugin "${name}" ya está registrado.`);
    }

    const resolvedPath = path.isAbsolute(pluginPath)
      ? pluginPath
      : path.resolve(__dirname, '..', pluginPath);

    let PluginClass;
    try {
      // Carga dinámica (require) — el corazón del enfoque "microkernel + plugins"
      PluginClass = require(resolvedPath);
    } catch (err) {
      throw new Error(
        `[PluginManager] No se pudo cargar el plugin "${name}" desde ${resolvedPath}: ${err.message}`
      );
    }

    const instance = new PluginClass(options);

    if (!(instance instanceof PluginInterface)) {
      throw new Error(
        `[PluginManager] El plugin "${name}" no implementa PluginInterface.`
      );
    }

    this.registry.set(name, instance);
    this.logger.log(`[PluginManager] Plugin "${name}" cargado desde ${resolvedPath}`);
    return instance;
  }

  /**
   * Carga múltiples plugins a partir de un arreglo de configuración.
   * @param {Array<object>} pluginsConfig
   */
  loadAll(pluginsConfig) {
    pluginsConfig.forEach((cfg) => this.loadPlugin(cfg));
  }

  /**
   * Obtiene una instancia de plugin ya registrada.
   * @param {string} name
   * @returns {PluginInterface}
   */
  get(name) {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new Error(`[PluginManager] Plugin "${name}" no encontrado en el registro.`);
    }
    return plugin;
  }

  has(name) {
    return this.registry.has(name);
  }

  list() {
    return Array.from(this.registry.keys());
  }

  getAll() {
    return this.registry;
  }
}

module.exports = PluginManager;
