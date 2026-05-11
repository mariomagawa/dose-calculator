# Documento de Requisitos do Produto (PRD)

## 1. Visão Geral do Produto
A **Calculadora de Reconstituição e Dose** é uma aplicação web client-side (SPA) projetada para auxiliar profissionais de saúde e pacientes a calcular com precisão a diluição (reconstituição) de medicamentos/peptídeos em pó e a extrair a dosagem correta usando seringas de insulina (U-100). 
O sistema visa proporcionar uma interface de usuário moderna, rápida, responsiva e à prova de erros, com um forte componente de visualização gráfica para evitar equívocos na leitura da seringa.

## 2. Objetivos e Metas
- **Precisão:** Eliminar erros matemáticos durante o processo de reconstituição e cálculo de dosagem.
- **Segurança do Usuário:** Fornecer feedback visual imersivo e avisos claros (ex: quando o volume a ser extraído ultrapassa a capacidade da seringa).
- **Usabilidade:** Oferecer uma experiência de usuário (UX) fluida em dispositivos móveis e desktops, sem necessidade de recarregar a página.
- **Acessibilidade Offline:** Como é 100% client-side, após o carregamento inicial, não há dependência de servidor para realizar os cálculos.

## 3. Público-Alvo
- **Pacientes:** Indivíduos em tratamentos que exigem autoadministração de medicamentos reconstituídos (ex: peptídeos, hormônios).
- **Profissionais de Saúde:** Enfermeiros, médicos e farmacêuticos que necessitam de uma ferramenta de validação rápida ou auxílio visual.

## 4. Requisitos Funcionais

### 4.1. Entradas de Dados (Inputs)
O usuário deve ser capaz de selecionar ou inserir os seguintes parâmetros em seções agrupadas (Cards):

1. **Conteúdo do Frasco (mg):**
   - Botões de seleção rápida (5mg, 10mg, 15mg, 20mg, 30mg, 60mg).
   - Campo de entrada numérica para valores personalizados.
2. **Quantidade de Diluente (mL):**
   - Botões de seleção rápida (0.5mL, 1mL, 2mL, 2.4mL, 2.5mL, 4mL).
   - Campo de entrada numérica para valores personalizados.
3. **Tamanho da Seringa (U-100):**
   - 0.3mL (30 Unidades).
   - 0.5mL (50 Unidades).
   - 1mL (100 Unidades).
4. **Dose Desejada (mg):**
   - Grade de botões com as doses mais comuns (0.25mg até 30mg).
   - Campo de entrada numérica para valores personalizados.

### 4.2. Motor de Cálculo
A aplicação deve ser capaz de calcular os seguintes dados em tempo real, baseando-se nos inputs fornecidos:
- **Concentração (mg/mL):** `Conteúdo do Frasco (mg) / Quantidade de Diluente (mL)`
- **Volume a Puxar (mL):** `Dose Desejada (mg) / Concentração (mg/mL)`
- **Unidades a Puxar (U-100):** `Volume a Puxar (mL) * 100`
- **Total de Doses por Frasco:** `Conteúdo do Frasco (mg) / Dose Desejada (mg)`

### 4.3. Visualização e Resultados
- **Feedback Gráfico (Seringa Interativa):** 
  - Renderização visual de uma seringa que se preenche dinamicamente com "líquido" em proporção à capacidade da seringa selecionada e o volume a puxar.
  - As marcações na seringa devem se adaptar (ex: de 5 em 5 até 30, ou de 10 em 10 até 100) dependendo do tamanho da seringa escolhido.
  - Movimentação do êmbolo conforme o preenchimento.
- **Avisos de Segurança:** Exibir mensagem de erro ou aviso com coloração destacada (vermelho) se o volume calculado exceder a capacidade da seringa selecionada.
- **Painel de Resultados:** Exibir a quantidade a ser puxada de forma clara (`X mL` ou `Y Unidades`), juntamente com estatísticas secundárias (doses restantes e concentração).

### 4.4. Ações Complementares
- **Botão "Limpar":** Deve resetar todos os estados, limpar botões selecionados, apagar inputs personalizados e esconder o painel de resultados.
- **Botão "Imprimir":** Acionar o modo de impressão nativo do navegador para facilitar a guarda física da prescrição ou cálculo.

## 5. Requisitos Não Funcionais

### 5.1. Design e Interface (UI/UX)
- **Design Responsivo:** A interface deve adaptar o tamanho das fontes, grade de botões (grid) e elementos da seringa para se adequarem perfeitamente em telas de smartphones, tablets e monitores desktop.
- **Estética Moderna:** Uso de fontes sem serifa modernas (ex: Inter), cantos arredondados, sombras suaves e transições animadas.
- **Feedback Tátil/Visual:** Botões devem mostrar estados de `hover` e `active` (selecionado). 

### 5.2. Tecnologia e Arquitetura
- **Stack Tecnológico:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla - ES6+).
- **Sem Frameworks Pesados:** A fim de manter o carregamento instantâneo, evitar frameworks caso não haja requisitos de roteamento complexos.
- **Performance:** Os cálculos devem ser realizados em complexidade O(1) diretamente no navegador do cliente assim que o estado mudar.

### 5.3. Suporte de Navegadores
- Compatibilidade com as duas últimas versões dos principais navegadores (Chrome, Safari, Firefox, Edge) tanto em desktop quanto em mobile.

## 6. Lógica de Estado (Flow)
1. Estado inicial: Todos os valores `null`. Painel de resultados exibe um *placeholder*.
2. Usuário interage com os cards.
3. Listener de eventos atualiza o objeto de `state`.
4. Função `calculate()` é acionada:
   - Se `vialMg`, `diluentMl`, `syringeMl` e `doseMg` não forem nulos, realiza a matemática.
   - Atualiza o DOM (textos numéricos).
   - Altera a largura do líquido da seringa via manipulação de estilo CSS e posiciona o êmbolo.
   - Verifica limites e exibe `syringeWarning` se necessário.
5. Se algum dos inputs essenciais for desmarcado (ou apagado), esconde os resultados e volta o *placeholder*.

## 7. Casos Extremos (Edge Cases) e Tratamento
- **Dose excede a seringa:** O percentual visual trava em 100%, cor do líquido e marcações mudam para um tom de alerta. A interface informa claramente que é necessária uma seringa maior ou múltiplas injeções.
- **Inputs negativos ou inválidos:** Campos customizados de `type="number"` com `min="0"`. Validação no JavaScript que ignora o cálculo se valores forem menores que zero ou nulos (NaN).
- **Infinidade/Divisão por Zero:** Devido à validação de > 0, o divisor `diluentMl` e `concentration` nunca serão zero no momento do cálculo.

## 8. Futuras Iterações (V2 - Backlog)
- Suporte a PWA (Progressive Web App) para instalação offline nos celulares.
- Temas claro/escuro nativos.
- Suporte a seringas diferentes (U-40).
- Salvar cálculos recentes (LocalStorage).
