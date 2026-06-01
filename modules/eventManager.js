class EventManager {
  #permissaoParaRodar = false;
  #listenerAtivo = false;

  get permissaoParaRodar() {
    return this.#permissaoParaRodar;
  }

}

export const eventManager = new EventManager();
