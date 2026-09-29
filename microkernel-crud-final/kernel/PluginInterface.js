/**
 * kernel/PluginInterface.js
 * -----------------------------------------------------------------------
 * Contrato base (clase abstracta) que TODOS los plugins deben implementar.
 * Define el ciclo de vida estándar de un plugin dentro del microkernel:
 *
 *   init(context)      -> se ejecuta una única vez al cargar el plugin.
 *   execute(action, payload) -> punto de entrada para invocar una acción.
 *   destroy()          -> libera recursos (conexiones, timers, etc).
 *
 * El Kernel nunca conoce la lógica interna de un plugin: solo conoce
 * este contrato. Esto es lo que permite que los plugins sean
 * intercambiables y que el núcleo se mantenga minimalista.
 * -----------------------------------------------------------------------
 */

class PluginInterface {
  /**
   * @param {string} name Nombre único del plugin (usado como clave de registro)
   */
  constructor(name) {
    if (new.target === PluginInterface) {
      throw new Error(
        '[PluginInterface] No se puede instanciar directamente. Debe ser extendida.'
      );
    }
    if (!name) {
      throw new Error('[PluginInterface] Todo plugin requiere un "name".');
    }
    this.name = name;
    this.initialized = false;
  }

  /**
   * Inicializa el plugin (conexiones, configuración, etc).
   * @param {object} context Contexto compartido que expone el Kernel
   *                         (config global, logger, registro de otros plugins).
   */
  async init(context) {
    throw new Error(`[${this.name}] El método init() no está implementado.`);
  }

  /**
   * Ejecuta una acción soportada por el plugin.
   * @param {string} action Nombre de la acción (ej: 'create', 'findAll', 'query')
   * @param {object} payload Datos necesarios para ejecutar la acción
   * @returns {Promise<any>}
   */
  async execute(action, payload) {
    throw new Error(`[${this.name}] El método execute() no está implementado.`);
  }

  /**
   * Libera recursos usados por el plugin (pools de conexión, listeners, etc).
   */
  async destroy() {
    throw new Error(`[${this.name}] El método destroy() no está implementado.`);
  }
}

module.exports = PluginInterface;
