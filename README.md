
---

# 🚀 Manga & Webcomic Translator (Browser Extension)

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-orange.svg?style=for-the-badge)
![Manifest](https://img.shields.io/badge/Manifest-V3-brightgreen.svg?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Chrome_|_Edge_|_Brave-lightgrey.svg?style=for-the-badge)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg?style=for-the-badge)

Uma extensão de alta performance desenhada para detetar, extrair e traduzir balões de texto em tempo real. O foco absoluto é a **otimização de hardware** e a eliminação de custos de infraestrutura através de uma arquitetura **100% Client-Side**.

[**Demonstração UI**](#-interface-e-fluxo-de-trabalho) • [**Motor de Avisos**](#-core-ui-engine-avisomanager) • [**Visão de Produto**](#-experiência-de-leitura--validação-de-layout) • [**Arquitetura**](#-visão-geral-da-arquitetura)

---

## 🎯 O Desafio de Engenharia
Tradutores de ecrã tradicionais dependem de servidores pesados, gerando latência e destruindo a arte original ao "queimar" o texto na imagem. 

**Este projeto resolve isso com:**
1.  **Zero-Cost Architecture:** Todo o processamento visual (Canvas API) e OCR ocorrem no hardware do utilizador.
2.  **Renderização Não Destrutiva:** Injeção dinâmica de DOM (HTML/CSS) sobre os balões originais.
3.  **Gestão de Memória:** Prevenção ativa de memory leaks com `URL.revokeObjectURL` e cache estruturado em `IndexedDB` para suportar centenas de imagens por sessão.

---

## 📸 Interface e Fluxo de Trabalho (UI/UX)

A interface principal (**Manga Loader**) é minimalista e funcional, focada em automação. O sistema deteta o idioma da página ou recupera seleções anteriores, exigindo poucos cliques para iniciar.

<table width="100%">
  <tr>
    <td width="33.3%" align="center">
      <img src="https://github.com/user-attachments/assets/2d72ef18-bd2e-4253-9f08-f1ed212cf1c1" width="100%"/><br/>
      <b>Configuração Inicial</b><br/>
      <sub>Deteção inteligente e confirmação de idioma.</sub>
    </td>
    <td width="33.3%" align="center">
      <img src="https://github.com/user-attachments/assets/4f0b1927-318e-4e41-9182-391737388577" width="100%"/><br/>
      <b>Sessão Ativa</b><br/>
      <sub>Controlo de estado (Iniciar/Parar) em tempo real.</sub>
    </td>
    <td width="33.3%" align="center">
      <img src="https://github.com/user-attachments/assets/aa14784c-c010-45b5-aa44-924c788cbc14" width="100%"/><br/>
      <b>Validação de Parâmetros</b><br/>
      <sub>Avisos de UX para garantir a tradução correta.</sub>
    </td>
  </tr>
</table>

---

## 🛠️ Core UI Engine: AvisoManager

Todo o sistema de notificações e feedback visual foi arquitetado do zero (**Zero-Library Dependency**). O `AvisoManager` opera através de injeção dinâmica no DOM, garantindo custo zero de processamento na carga inicial da página hospedeira.

*   **Async Workflow:** Utiliza `Promises` nativas para orquestrar fluxos de interação (como confirmações em modais).
*   **Encapsulamento:** Injeção segura de SVGs e CSS isolado apenas no momento da execução.

<table width="100%">
  <tr>
    <td align="center"><b>Status & Toasts (Progresso)</b></td>
    <td align="center"><b>Modais de Decisão (Promises)</b></td>
    <td align="center"><b>Alertas Críticos (Feedback)</b></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/60908e49-61a2-40c8-9457-fe5e898ca3ea" width="280px"/><br/>
      <img src="https://github.com/user-attachments/assets/95da4efe-c4c3-44dc-a638-ce0dd183bdd0" width="280px"/>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/39be1156-7148-487b-8000-a3c42fcb542a" width="280px"/><br/>
      <img src="https://github.com/user-attachments/assets/2be98610-eeb0-42df-b1a0-4b0dd0b28258" width="280px"/>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/0d4f89d6-4791-4d2a-8071-61ec9bcd3931" width="250px"/><br/>
      <img src="https://github.com/user-attachments/assets/388156fc-9d9f-40d8-9b2b-da3d4b585522" width="250px"/><br/>
      <img src="https://github.com/user-attachments/assets/804e8eae-a81a-47f0-93be-f20d56cb9cc0" width="250px"/>
    </td>
  </tr>
</table>

---

## 📖 Experiência de Leitura & Validação de Layout

O projeto evoluiu de uma simples injeção de texto para um conceito de **Ambiente de Leitura Isolado**. O objetivo é desacoplar o conteúdo do site de origem para garantir estabilidade total e imortalidade da tradução.

<table width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/user-attachments/assets/51f8d270-0f71-477d-9467-6e0bcac388f7" width="100%"/><br/>
      <b>Tradução Dinâmica (Overlay)</b><br/>
      <sub>Mapeamento sobre o DOM original em tempo real.</sub>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/user-attachments/assets/8cd563da-c2bc-4ce5-8388-d2ffccaf535b" width="100%"/><br/>
      <b>Protótipo de Leitor Nativo (Vision)</b><br/>
      <sub>Extração de imagens para um ambiente próprio, garantindo que as coordenadas persistidas no banco nunca "desalinhem".</sub>
    </td>
  </tr>
</table>

---

## ✨ Funcionalidades Principais

*   **Comunicação Cross-World & SPAs:** Injeção no *Main World* para intercetar a `History API`, permitindo funcionamento em sites dinâmicos (Single Page Applications).
*   **Processamento Matemático:** Algoritmos de *Thresholding* (Binarização) via **Canvas API** para limpar texturas e otimizar o motor de OCR.
*   **Estratégia Anti-CORS:** Sistema de *fallback* automático que captura pixels diretamente da renderização da tela caso o acesso direto à imagem seja bloqueado.

---

## 🏗️ Visão Geral da Arquitetura

1.  **`injetor.js` (Main World):** Monitoriza navegações silenciosas e mudanças de estado da página.
2.  **`content.js` & `filtro.js`:** Observadores visuais com varredura *on-scroll* e gestão de Garbage Collection.
3.  **`background.js` (Service Worker):** Orquestrador assíncrono que gere o `IndexedDB` e delega tarefas pesadas.
4.  **`MangaCache` (IndexedDB):** Persistência de coordenadas e metadados para leitura offline ou persistente.

---

## 🚧 Status Atual e Próximos Passos

O projeto encontra-se em desenvolvimento ativo, focado em resolver a dívida técnica (Technical Debt):
*   **Refatoração para Orientação a Objetos (OOP):** Migrando a estrutura de módulos para um design baseado em Classes.
*   **Reorganização de Módulos:** Aplicação rigorosa dos princípios **SOLID** para separar lógicas de interface e processamento.
*   **Estabilidade:** Fortalecimento do pipeline de tradução para suportar novas funcionalidades sem quebrar integrações existentes.

---

## 🚀 Tecnologias Utilizadas

*   **Linguagem:** JavaScript Vanilla (ES6+) moderno.
*   **Ecossistema:** Chrome Extension API (Manifest V3).
*   **Processamento:** HTML5 Canvas API e Blob Management.
*   **Armazenamento:** `IndexedDB` nativo e `chrome.storage`.

---

## 📝 Licença
Distribuído sob a licença **GNU AGPL-3.0**. O código fonte derivado deve ser mantido aberto sob a mesma licença.
