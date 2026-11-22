// Catálogo de peptídeos, códigos comerciais, apresentações, presets e parâmetros farmacocinéticos

export const PEPTIDE_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'glp1', label: 'GLP-1 / Emagrecimento' },
  { id: 'secretagogue', label: 'Secretagogos GH' },
  { id: 'regeneration', label: 'Cobre & Reparo' },
  { id: 'mitochondrial', label: 'Mitocondriais & Longevidade' },
  { id: 'neuropeptide', label: 'Neuropeptídeos' },
  { id: 'blends', label: 'Blends Especiais' },
  { id: 'custom', label: 'Personalizado' }
];

export const DILUENT_OPTIONS = [
  { value: 0.5, label: '0.5mL' },
  { value: 1, label: '1mL' },
  { value: 2, label: '2mL' },
  { value: 2.4, label: '2.4mL' },
  { value: 3, label: '3mL' },
  { value: 3.5, label: '3.5mL' },
  { value: 4, label: '4mL' },
  { value: 5, label: '5mL' }
];

export const SYRINGE_OPTIONS = [
  { value: 0.3, ml: '0.3mL', units: '(30 U)' },
  { value: 0.5, ml: '0.5mL', units: '(50 U)' },
  { value: 1, ml: '1mL', units: '(100 U)' }
];

export const ADDITIONAL_HORMONES = [
  { name: 'Testosterona Cipionato', halfLifeDays: 8.0, categoryLabel: 'Hormônios', unit: 'mg' },
  { name: 'Testosterona Enantato', halfLifeDays: 4.5, categoryLabel: 'Hormônios', unit: 'mg' },
  { name: 'Nandrolona Decanoato', halfLifeDays: 6.0, categoryLabel: 'Hormônios', unit: 'mg' }
];

export const DEFAULT_VIAL_SIZES = [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const DEFAULT_UI_VIAL_SIZES = [100, 200, 300, 500, 1000];
export const DEFAULT_UI_DOSE_VALUES = [10, 20, 25, 50, 75, 100, 150, 200];

export const PEPTIDES = [
  // GLP-1 / Emagrecimento
  {
    id: 'tirzepatida',
    name: 'Tirzepatida',
    code: 'TR15 / TR20 / TR60 / TR90',
    category: 'glp1',
    categoryLabel: 'GLP-1 / Emagrecimento',
    unit: 'mg',
    halfLifeDays: 5.0,
    defaultFrequencyDays: 7,
    vials: [15, 20, 30, 60, 90],
    defaultVial: 15,
    defaultDiluent: 2,
    defaultSyringe: 1,
    defaultDose: 2.5,
    doses: [
      { value: 1, label: '1mg' },
      { value: 1.5, label: '1.5mg' },
      { value: 2, label: '2mg' },
      { value: 2.5, label: '2.5mg' },
      { value: 5, label: '5mg' },
      { value: 7.5, label: '7.5mg' },
      { value: 10, label: '10mg' },
      { value: 12.5, label: '12.5mg' },
      { value: 15, label: '15mg' }
    ],
    description: 'Duplo agonista GLP-1/GIP para controle glicêmico e redução de peso.',
    badge: 'Popular'
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    code: 'RT30 / RT40 / RT60',
    category: 'glp1',
    categoryLabel: 'GLP-1 / Emagrecimento',
    unit: 'mg',
    halfLifeDays: 6.0,
    defaultFrequencyDays: 7,
    vials: [30, 40, 60],
    defaultVial: 30,
    defaultDiluent: 3,
    defaultSyringe: 1,
    defaultDose: 2,
    doses: [
      { value: 1, label: '1mg' },
      { value: 2, label: '2mg' },
      { value: 4, label: '4mg' },
      { value: 6, label: '6mg' },
      { value: 8, label: '8mg' },
      { value: 10, label: '10mg' },
      { value: 12, label: '12mg' }
    ],
    description: 'Triplo agonista GLP-1/GIP/Glucagon de alta potência.',
    badge: 'Nova Geração'
  },
  {
    id: 'semaglutida',
    name: 'Semaglutida',
    code: 'SM5 / SM10',
    category: 'glp1',
    categoryLabel: 'GLP-1 / Emagrecimento',
    unit: 'mg',
    halfLifeDays: 7.0,
    defaultFrequencyDays: 7,
    vials: [5, 10],
    defaultVial: 5,
    defaultDiluent: 2,
    defaultSyringe: 1,
    defaultDose: 0.25,
    doses: [
      { value: 0.25, label: '0.25mg' },
      { value: 0.5, label: '0.5mg' },
      { value: 1, label: '1mg' },
      { value: 1.7, label: '1.7mg' },
      { value: 2.4, label: '2.4mg' }
    ],
    description: 'Agonista GLP-1 para regulação de apetite e saciedade.'
  },

  // Secretagogos GH
  {
    id: 'cjc-dac',
    name: 'DAC (CJC-1295 c/ DAC)',
    code: 'CP10',
    category: 'secretagogue',
    categoryLabel: 'Secretagogos GH',
    unit: 'mg',
    halfLifeDays: 6.5,
    defaultFrequencyDays: 7,
    vials: [10],
    defaultVial: 10,
    defaultDiluent: 2,
    defaultSyringe: 1,
    defaultDose: 1,
    doses: [
      { value: 0.5, label: '0.5mg' },
      { value: 1, label: '1mg' },
      { value: 1.5, label: '1.5mg' },
      { value: 2, label: '2mg' }
    ],
    description: 'Análogo de GHRH com DAC para liberação sustentada de GH.',
    badge: 'Ação Longa'
  },
  {
    id: 'cjc-no-dac',
    name: 'CJC SEM DAC (Mod-GRF 1-29)',
    code: 'CND5 / CND10',
    category: 'secretagogue',
    categoryLabel: 'Secretagogos GH',
    unit: 'mg',
    doseUnit: 'mcg',
    halfLifeDays: 0.03,
    defaultFrequencyDays: 1,
    vials: [5, 10],
    defaultVial: 5,
    defaultDiluent: 2,
    defaultSyringe: 0.5,
    defaultDose: 0.1,
    doses: [
      { value: 0.1, label: '100 mcg', sublabel: '0.1mg' },
      { value: 0.15, label: '150 mcg', sublabel: '0.15mg' },
      { value: 0.2, label: '200 mcg', sublabel: '0.2mg' },
      { value: 0.3, label: '300 mcg', sublabel: '0.3mg' }
    ],
    description: 'Estimulador de pulso fisiológico de GH. Geralmente associado ao Ipamorelin.',
    badge: 'Pulso Rápido'
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    code: 'IP5 / IP10',
    category: 'secretagogue',
    categoryLabel: 'Secretagogos GH',
    unit: 'mg',
    doseUnit: 'mcg',
    halfLifeDays: 0.08,
    defaultFrequencyDays: 1,
    vials: [5, 10],
    defaultVial: 5,
    defaultDiluent: 2,
    defaultSyringe: 0.5,
    defaultDose: 0.2,
    doses: [
      { value: 0.1, label: '100 mcg', sublabel: '0.1mg' },
      { value: 0.2, label: '200 mcg', sublabel: '0.2mg' },
      { value: 0.25, label: '250 mcg', sublabel: '0.25mg' },
      { value: 0.3, label: '300 mcg', sublabel: '0.3mg' }
    ],
    description: 'Secretagogo de GH altamente seletivo, sem elevar cortisol ou prolactina.',
    badge: 'Alta Afinidade'
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    code: 'TSM10',
    category: 'secretagogue',
    categoryLabel: 'Secretagogos GH',
    unit: 'mg',
    halfLifeDays: 0.04,
    defaultFrequencyDays: 1,
    vials: [10],
    defaultVial: 10,
    defaultDiluent: 2,
    defaultSyringe: 1,
    defaultDose: 1,
    doses: [
      { value: 0.5, label: '0.5mg' },
      { value: 1, label: '1mg' },
      { value: 1.5, label: '1.5mg' },
      { value: 2, label: '2mg' }
    ],
    description: 'Análogo de GHRH com grande eficácia na redução de gordura visceral.',
    badge: 'Gordura Visceral'
  },

  // Cobre & Reparo
  {
    id: 'ghk-cu',
    name: 'GHK-Cu (Peptídeo de Cobre)',
    code: 'CU50 / CU100',
    category: 'regeneration',
    categoryLabel: 'Cobre & Reparo',
    unit: 'mg',
    halfLifeDays: 0.15,
    defaultFrequencyDays: 1,
    vials: [50, 100],
    defaultVial: 50,
    defaultDiluent: 3,
    defaultSyringe: 1,
    defaultDose: 2,
    doses: [
      { value: 1, label: '1mg' },
      { value: 1.5, label: '1.5mg' },
      { value: 2, label: '2mg' },
      { value: 2.5, label: '2.5mg' },
      { value: 5, label: '5mg' }
    ],
    description: 'Estimula síntese de colágeno, elastina, angiogênese e reparo tecidual.',
    badge: 'Colágeno & Pele'
  },

  // Blends
  {
    id: 'glow',
    name: 'GLOW (GHK-Cu / BPC / TB)',
    code: 'GLOW70',
    category: 'blends',
    categoryLabel: 'Blends Especiais',
    unit: 'mg',
    halfLifeDays: 0.2,
    defaultFrequencyDays: 1,
    vials: [70],
    defaultVial: 70,
    defaultDiluent: 3.5,
    defaultSyringe: 1,
    defaultDose: 2.1,
    doses: [
      { value: 1.4, label: '1.4mg' },
      { value: 2.1, label: '2.1mg' },
      { value: 2.8, label: '2.8mg' },
      { value: 3.5, label: '3.5mg' }
    ],
    description: 'Blend sinérgico de 70mg totais (GHK-Cu 50mg + BPC-157 10mg + TB-500 10mg).',
    badge: 'Blend 70mg'
  },
  {
    id: 'klow',
    name: 'KLOW (GHK / KPV / BPC / TB)',
    code: 'KLOW80',
    category: 'blends',
    categoryLabel: 'Blends Especiais',
    unit: 'mg',
    halfLifeDays: 0.2,
    defaultFrequencyDays: 1,
    vials: [80],
    defaultVial: 80,
    defaultDiluent: 4,
    defaultSyringe: 1,
    defaultDose: 2.4,
    doses: [
      { value: 1.6, label: '1.6mg' },
      { value: 2.4, label: '2.4mg' },
      { value: 3.2, label: '3.2mg' },
      { value: 4.0, label: '4.0mg' }
    ],
    description: 'Blend avançado de 80mg totais com peptídeo anti-inflamatório KPV.',
    badge: 'Blend 80mg'
  },

  // Mitocondriais & Longevidade
  {
    id: 'mots-c',
    name: 'MOTS-c (MOST-C)',
    code: 'MS40',
    category: 'mitochondrial',
    categoryLabel: 'Mitocondriais & Longevidade',
    unit: 'mg',
    halfLifeDays: 0.18,
    defaultFrequencyDays: 3.5,
    vials: [40],
    defaultVial: 40,
    defaultDiluent: 2,
    defaultSyringe: 1,
    defaultDose: 5,
    doses: [
      { value: 2.5, label: '2.5mg' },
      { value: 5, label: '5mg' },
      { value: 10, label: '10mg' }
    ],
    description: 'Peptídeo mitocondrial para sensibilidade insulínica e biogênese energética.',
    badge: 'Metabólico'
  },
  {
    id: 'ss-31',
    name: 'SS-31 (Elamipretide)',
    code: '2S10',
    category: 'mitochondrial',
    categoryLabel: 'Mitocondriais & Longevidade',
    unit: 'mg',
    halfLifeDays: 0.15,
    defaultFrequencyDays: 1,
    vials: [10],
    defaultVial: 10,
    defaultDiluent: 2,
    defaultSyringe: 1,
    defaultDose: 2,
    doses: [
      { value: 1, label: '1mg' },
      { value: 2, label: '2mg' },
      { value: 4, label: '4mg' },
      { value: 5, label: '5mg' }
    ],
    description: 'Restaura a cardiolipina na membrana mitocondrial interna e reduz estresse oxidativo.',
    badge: 'Mitocondrial'
  },
  {
    id: 'slu-pp-332',
    name: 'SLU-PP-332 (SLU-PP32)',
    code: '322',
    category: 'mitochondrial',
    categoryLabel: 'Mitocondriais & Longevidade',
    unit: 'mg',
    doseUnit: 'mcg',
    halfLifeDays: 0.25,
    defaultFrequencyDays: 1,
    vials: [5],
    defaultVial: 5,
    defaultDiluent: 2,
    defaultSyringe: 0.5,
    defaultDose: 0.5,
    doses: [
      { value: 0.25, label: '250 mcg', sublabel: '0.25mg' },
      { value: 0.5, label: '500 mcg', sublabel: '0.5mg' },
      { value: 1, label: '1mg' }
    ],
    description: 'Agonista do receptor relacionado a estrogênio (ERR) - mimético de exercício físico.',
    badge: 'Mimético Exercício'
  },
  {
    id: 'nad',
    name: 'NAD+ (Nicotinamida Adenina Dinucleotídeo)',
    code: 'NJ100 / NJ500 / NJ1000',
    category: 'mitochondrial',
    categoryLabel: 'Mitocondriais & Longevidade',
    unit: 'mg',
    halfLifeDays: 0.08,
    defaultFrequencyDays: 1,
    vials: [100, 500, 1000],
    defaultVial: 500,
    defaultDiluent: 5,
    defaultSyringe: 1,
    defaultDose: 50,
    doses: [
      { value: 25, label: '25mg' },
      { value: 50, label: '50mg' },
      { value: 100, label: '100mg' },
      { value: 200, label: '200mg' }
    ],
    description: 'Coenzima essencial para produção de ATP, reparo de DNA e ativação de sirtuínas.',
    badge: 'Coenzima Celular'
  },

  // Neuropeptídeos & Outros
  {
    id: 'selank',
    name: 'Selank',
    code: 'SK10',
    category: 'neuropeptide',
    categoryLabel: 'Neuropeptídeos',
    unit: 'mg',
    doseUnit: 'mcg',
    halfLifeDays: 0.05,
    defaultFrequencyDays: 1,
    vials: [10],
    defaultVial: 10,
    defaultDiluent: 2,
    defaultSyringe: 0.5,
    defaultDose: 0.3,
    doses: [
      { value: 0.15, label: '150 mcg', sublabel: '0.15mg' },
      { value: 0.25, label: '250 mcg', sublabel: '0.25mg' },
      { value: 0.3, label: '300 mcg', sublabel: '0.3mg' },
      { value: 0.5, label: '500 mcg', sublabel: '0.5mg' }
    ],
    description: 'Peptídeo regulador de neurotransmissores com efeito ansiolítico e nootrópico.',
    badge: 'Ansiolítico & Foco'
  },
  {
    id: 'pt-141',
    name: 'PT-141 (Bremelanotide)',
    code: 'P41',
    category: 'neuropeptide',
    categoryLabel: 'Neuropeptídeos',
    unit: 'mg',
    halfLifeDays: 0.11,
    defaultFrequencyDays: 1,
    vials: [10],
    defaultVial: 10,
    defaultDiluent: 2,
    defaultSyringe: 0.5,
    defaultDose: 1,
    doses: [
      { value: 0.5, label: '0.5mg' },
      { value: 1, label: '1mg' },
      { value: 1.5, label: '1.5mg' },
      { value: 2, label: '2mg' }
    ],
    description: 'Agonista do receptor de melanocortina para estimulação da libido e desejo.',
    badge: 'Sob Demanda'
  }
];

export const GENERIC_PEPTIDE = {
  id: 'custom',
  name: 'Outro / Personalizado',
  code: 'Livre',
  category: 'custom',
  categoryLabel: 'Personalizado',
  unit: 'mg',
  halfLifeDays: 5.0,
  defaultFrequencyDays: 7,
  vials: DEFAULT_VIAL_SIZES,
  defaultVial: null,
  defaultDiluent: null,
  defaultSyringe: null,
  defaultDose: null,
  doses: [0.1, 0.25, 0.5, 1, 2, 2.5, 3, 5, 7.5, 10, 15].map(v => ({
    value: v,
    label: v < 1 ? `${Math.round(v * 1000)}mcg` : `${v}mg`,
    sublabel: v < 1 ? `${v}mg` : null
  })),
  description: 'Insira qualquer valor de frasco, diluente, unidade e dosagem livremente.'
};
