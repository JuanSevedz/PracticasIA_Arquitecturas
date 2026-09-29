/**
 * kernel/Kernel.js
 * -----------------------------------------------------------------------
 * NÚCLEO (Kernel) del sistema.
 *
 * Responsabilidades (y SOLO estas — a propósito es minimalista):
 *   1. Cargar los plugins dinámicamente vía PluginManager.
 *   2. Ejecutar el ciclo de vida (init) de cada plugin al arrancar.
 *   3. Exponer un único punto de entrada `execute(pluginName, action, payload)`
 *      para que cualquier capa externa (API REST, CLI, colas, etc.)
 *      invoque funcionalidad sin conocer los detalles internos.
 *   4. Cerrar ordenadamente todos los plugins (destroy) al apagar.
 *
 * El Kernel NO sabe qué es "MySQL" ni qué es "Productos": esa lógica
 * vive exclusivamente en los plugins. Esto es lo que garantiza que el
 * núcleo permanezca estable aunque se agreguen/quiten/cambien plugins.
 * -----------------------------------------------------------------------
 */

const PluginManager = require('./PluginManager');

class Kernel {
  /**
   * @param {object} options
   * @param {Array<object>} options.pluginsConfig Configuración de plugins a cargar
   * @param {object} [options.globalConfig] Config compartida (ej: credenciales DB)
   * @param {object} [options.logger] Logger custom (por defecto console)
   */
  constructor({ pluginsConfig = [], globalConfig = {}, logger = console } = {}) {
    this.logger = logger;
    this.globalConfig = globalConfig;
    this.pluginManager = new PluginManager(logger);
    this.pluginsConfig = pluginsConfig;
    this.booted = false;
  }

  /**
   * Arranca el kernel: carga plugins y ejecuta su init() en orden.
   * El "context" que reciben los plugins les permite acceder a:
   *   - config global
   *   - logger
   *   - al propio kernel (para poder invocar OTROS plugins, ej:
   *     el plugin CRUD necesita invocar al plugin de MySQL)
   */
  async boot() {
    if (this.booted) {
      this.logger.warn('[Kernel] boot() llamado más de una vez, se ignora.');
      return;
    }

    this.pluginManager.loadAll(this.pluginsConfig);

    const context = {
      config: this.globalConfig,
      logger: this.logger,
      kernel: this, // permite comunicación entre plugins vía kernel.execute()
    };

    for (const [name, plugin] of this.pluginManager.getAll()) {
      try {
        await plugin.init(context);
        plugin.initialized = true;
        this.logger.log(`[Kernel] Plugin "${name}" inicializado correctamente.`);
      } catch (err) {
        this.logger.error(`[Kernel] Error inicializando plugin "${name}":`, err.message);
        throw err; // Un fallo de init aborta el arranque (fail-fast)
      }
    }

    this.booted = true;
    this.logger.log(`[Kernel] Arranque completo. Plugins activos: ${this.pluginManager.list().join(', ')}`);
  }

  /**
   * ÚNICO punto de entrada funcional del sistema.
   * Cualquier capa externa (rutas HTTP, CLI, jobs) pasa por aquí.
   *
   * @param {string} pluginName Nombre del plugin destino (ej: 'productos-crud')
   * @param {string} action Acción a ejecutar (ej: 'create', 'findAll')
   * @param {object} [payload] Datos de entrada para la acción
   * @returns {Promise<any>}
   */
  async execute(pluginName, action, payload = {}) {
    if (!this.booted) {
      throw new Error('[Kernel] No se puede ejecutar: el kernel aún no ha sido arrancado (boot()).');
    }
    const plugin = this.pluginManager.get(pluginName);
    if (!plugin.initialized) {
      throw new Error(`[Kernel] El plugin "${pluginName}" no está inicializado.`);
    }
    return plugin.execute(action, payload);
  }

  /**
   * Apaga ordenadamente todos los plugins (útil en SIGTERM/SIGINT).
   */
  async shutdown() {
    for (const [name, plugin] of this.pluginManager.getAll()) {
      try {
        await plugin.destroy();
        this.logger.log(`[Kernel] Plugin "${name}" destruido correctamente.`);
      } catch (err) {
        this.logger.error(`[Kernel] Error destruyendo plugin "${name}":`, err.message);
      }
    }
    this.booted = false;
  }
}

module.exports = Kernel;
