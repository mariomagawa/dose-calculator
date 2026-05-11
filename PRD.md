# Documento de Requisitos do Produto (PRD)

## 1. Visão Geral do Produto
A **Calculadora de Reconstituição e Dose** é uma aplicação web client-side (SPA) projetada para auxiliar profissionais de saúde e pacientes a calcular com precisão a diluição (reconstituição) de medicamentos/peptídeos em pó e a extrair a dosagem correta usando seringas de insulina (U-100). 
O sistema visa proporcionar uma interface de usuário ultrassofisticada e de última geração, garantindo usabilidade à prova de erros, com forte componente de feedback visual e reatividade instantânea.

## 2. Objetivos e Metas
- **Precisão:** Eliminar erros matemáticos durante o processo de reconstituição e cálculo de dosagem.
- **Segurança do Usuário:** Fornecer feedback visual imersivo e avisos claros (ex: quando o volume a ser extraído ultrapassa a capacidade da seringa).
- **Usabilidade (State of the Art):** Layout em duas colunas (Desktop), navegação por "Passos", *Progressive Disclosure* para campos personalizados e reatividade imediata sem recarregar a página.
- **Acessibilidade Offline:** Sendo SPA baseada no cliente, processa todos os cálculos matemáticos nativamente no navegador.

## 3. Público-Alvo
- **Pacientes:** Indivíduos em tratamentos que exigem autoadministração de medicamentos reconstituídos (ex: peptídeos, hormônios).
- **Profissionais de Saúde:** Enfermeiros, médicos e farmacêuticos que necessitam de uma ferramenta de validação rápida ou auxílio visual.

## 4. Requisitos Funcionais

### 4.1. Entradas de Dados (Inputs)
O usuário deve ser capaz de selecionar ou inserir os seguintes parâmetros através de grupos opcionais segmentados (Cards com Steps):

1. **Passo 1: Conteúdo do Frasco (mg):**
   - Grade de botões de seleção (5mg, 10mg, 15mg, 20mg, 30mg, 60mg).
   - Botão expansível ("Personalizado...") para entrada numérica integrada à grade.
2. **Passo 2: Quantidade de Diluente (mL):**
   - Grade de botões (0.5mL, 1mL, 2mL, 2.4mL, 2.5mL, 4mL).
   - Opção "Personalizado...".
3. **Passo 3: Tamanho da Seringa (U-100):**
   - 0.3mL (30 Unidades), 0.5mL (50 Unidades), 1mL (100 Unidades).
4. **Passo 4: Dose Desejada (mg):**
   - Grade compacta de botões com doses padrão (0.25mg até 30mg).
   - Opção "Personalizado...".

### 4.2. Motor de Cálculo
A aplicação calcula as variáveis reativamente (`computed`) em tempo real:
- **Concentração (mg/mL):** `vialMg / diluentMl`
- **Volume a Puxar (mL):** `doseMg / concentration`
- **Unidades a Puxar (U-100):** `drawVolume * 100`
- **Total de Doses por Frasco:** `vialMg / doseMg`

### 4.3. Visualização e Resultados
- **Painel de Resultados (Sticky):** Fixado no lado direito da tela no Desktop, apresentando os resultados instantaneamente sem necessidade de rolagem de tela. Tipografia grande com `tabular-nums` para estabilidade visual.
- **Feedback Gráfico (Seringa Interativa):** Componente desacoplado (`SyringeVisual.vue`) que renderiza os limites líquidos dinamicamente via `width` (%), atualizando o fundo para modo de alerta caso a capacidade estoure.
- **Estatísticas Secundárias:** Apresentação elegante com ícones vectoriais exibindo a "Concentração" e a "Previsão de Doses do Frasco".

### 4.4. Ações Complementares
- **Limpar:** Reseta os estados reativos via interface de botões.
- **Imprimir:** Layout CSS otimizado para media-query de impressão, escondendo os campos e imprimindo o relatório limpo.

## 5. Requisitos Não Funcionais

### 5.1. Design e Interface (UI/UX)
- **Layout de Duas Colunas:** Painel de Configurações na esquerda e Painel de Resultados (sticky) na direita. Padrão flutuante.
- **Estética Temática:** Imagem de fundo médica microscópica com efeito interativo "Ken Burns" (30s) e sobreposição de luzes Aurora (Pulse effect) para profundidade 3D.
- **Ultra-Glassmorphism:** Uso intensivo de `backdrop-filter: blur(16px)` para fundos translúcidos elegantes.
- **Progressive Disclosure:** Entradas customizadas aparecem apenas se o botão for acionado, salvando espaço de tela.

### 5.2. Tecnologia e Arquitetura
- **Stack Tecnológico:** Vue 3 (Composition API / Script Setup), Vite, HTML5, CSS3 Nativo, Ícones `lucide-vue-next`.
- **Arquitetura Baseada em Componentes:** 
  - `App.vue`: Orquestra layout principal e reatividade central.
  - `OptionGroup.vue`: Card reutilizável com integração de `v-model`.
  - `SyringeVisual.vue`: Representação gráfica atômica.
- **Performance de Reatividade:** Cálculos O(1) engatilhados pela API de Reatividade nativa do Vue 3.

## 6. Casos Extremos (Edge Cases) e Vulnerabilidades Previstas
- **Dose excede a seringa:** O limite de renderização CSS trava em 100% prevenindo estouro visual e engatilha a UI condicional com `AlertTriangleIcon` em coloração de aviso.
- **Divisão por Zero / Valores Inválidos:** Todas as entradas manuais passam por checagem de parse Float. Cálculos não disparam a menos que variáveis dependentes sejam estritamente `> 0`. 
- **Injeção de Código (XSS):** Projeto não realiza requisições back-end nem utiliza primitivas DOM inseguras (como `v-html`), blindado nativamente pelo framework de templates do Vue. Dependências limpas testadas via `npm audit`.

## 7. Futuras Iterações (V2 - Backlog)
- Transição para PWA (Progressive Web App).
- Sistema de temas Alternativos / Modo Claro.
- LocalStorage para reter dados caso o navegador seja fechado.
