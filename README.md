# Manga & Webcomic Translator

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange.svg?style=for-the-badge)
![Tech](https://img.shields.io/badge/Tech-Vanilla_JS-yellow.svg?style=for-the-badge)
![Manifest](https://img.shields.io/badge/Manifest-V3-brightgreen.svg?style=for-the-badge)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg?style=for-the-badge)

Extensão de navegador 100% *Client-Side* para extração e tradução assíncrona de webcomics e mangás. 

Construído inteiramente em **Vanilla JS (Zero-Dependencies)**, este projeto serve como um laboratório prático para resolução de problemas nativos do navegador: manipulação pesada de DOM, otimização agressiva de memória e contorno de restrições de rede.

## 📸 Interface e Controle

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Configuração Inicial</b></td>
      <td align="center"><b>Sessão Ativa</b></td>
    </tr>
    <tr>
      <td align="center" valign="middle">
        <img width="280" src="https://github.com/user-attachments/assets/07cd416d-5a2d-4621-80d4-015702da5284" alt="Painel de Controle 1" />
      </td>
      <td align="center" valign="middle">
        <img width="280" src="https://github.com/user-attachments/assets/0428ac2c-f52f-4f82-b249-5ac7af444ee4" alt="Painel de Controle 2" />
      </td>
    </tr>
  </table>
</div>

## ⚙️ Core da Engenharia

* **Zero-Cost Architecture:** O processamento visual roda localmente. Sem dependência de servidores pesados.
* **Renderização Não Destrutiva:** Injeção de *DOM Overlay* com posicionamento absoluto para preservar a arte original.
* **Controle de Memória:** Prevenção ativa de *memory leaks* (Garbage Collection manual com `URL.revokeObjectURL`) e persistência em `IndexedDB` para suportar sessões com centenas de imagens.
* **Canvas API & Anti-CORS:** Binarização de imagens no front-end com sistema de *fallback* para captura direta de pixels em caso de bloqueios de rede.
* **Custom UI Engine (`AvisoManager`):** Sistema de modais e notificações orquestrado por Promises nativas e injeção *on-demand*, garantindo custo zero na carga inicial da página hospedeira.

## 🚧 Status e Roadmap (Refatoração)
O projeto está em desenvolvimento ativo. O foco atual não é adicionar features, mas pagar dívida técnica:
- Migração da arquitetura procedural para **Orientação a Objetos (OOP)**.
- Aplicação de princípios **SOLID** para isolar a camada visual (UI) do motor de processamento.
