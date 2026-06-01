class Utils {
  static #config = null;

  async getConfigHardware() {
    const dadosHardware = await StorageManager.buscar('global', 'hardware');
    const perfil = dadosHardware?.perfil || 'NORMAL';
    
    const configHardware = {
      ULTRA:  { scroll: 250, retry: 300, tentativas: 40, debounceWait: 800, }, 
      NORMAL: { scroll: 400, retry: 500, tentativas: 30, debounceWait: 1200, }, 
      LOW:    { scroll: 750, retry: 1000, tentativas: 20, debounceWait: 1400, } 
    };

    this.config = configHardware[perfil];
  }
}


/*
  Classes static: Uso quando são funções utilitárias que não guardam histórico
  e cujas configurações centrais são definidas uma única vez.
*/