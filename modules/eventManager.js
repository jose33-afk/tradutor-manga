class EventManager {
  #permissionToRun = false;
  #listenerActive = false;
  #Utils = null;

  constructor() {
    this.#Utils = importModule('./modules/utils.js', 'utils');
  }

  get permissionToRun() {
    return this.#permissionToRun;
  }

  async pararOperacaoGlobal() {
    this.#permissionToRun = false;

    // try {
    //   const response = await this.#Utils.gerenciarStorage("salvar", { estaCorrendo: false }, "aba");
    //   return response?.sucesso === true;
    // } catch(e) {
    //   console.warn("Background inaccessible at the time of shutdown.", e);
    //   return false;
    // }
  }
}

export const eventManager = new EventManager();
