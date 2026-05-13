export interface Choice {
  id: string
  text: string
  correct: boolean
}

export type PracticeType = 'fact-dimension' | 'multiple-choice' | 'theory' | 'flashcard'

export interface QuickPractice {
  id: string
  type: PracticeType
  
  // fact-dimension
  tableName?: string
  columns?: string[]
  correctType?: 'fact' | 'dimension'
  
  // multiple-choice & theory
  question?: string
  choices?: Choice[]
  
  // flashcard
  front?: string
  back?: string
  
  explanation?: string
}

export const quickPracticeData: QuickPractice[] = [
  {
    id: 'p1',
    type: 'fact-dimension',
    tableName: 'Ventas_Anuales',
    columns: ['id_venta', 'monto_total', 'id_cliente', 'id_fecha', 'cantidad'],
    correctType: 'fact',
    explanation: 'Contiene medidas cuantificables (monto, cantidad) y claves foráneas a dimensiones.',
  },
  {
    id: 'p2',
    type: 'fact-dimension',
    tableName: 'Dim_Productos',
    columns: ['id_producto', 'nombre_comercial', 'categoria', 'marca', 'precio_unitario_ref'],
    correctType: 'dimension',
    explanation: 'Describe las características de una entidad de negocio (producto).',
  },
  {
    id: 'f1',
    type: 'flashcard',
    front: 'SCD Tipo 2',
    back: 'Agrega una nueva fila con el nuevo valor, manteniendo el historial completo de cambios.',
  },
  {
    id: 'f2',
    type: 'flashcard',
    front: 'Dimensión Degenerada',
    back: 'Atributo que se incorpora directamente en la tabla de hechos sin tabla de dimensión propia (ej: nro factura).',
  },
  {
    id: 'q_mc1',
    type: 'multiple-choice',
    question: '¿Qué campos cambiarías en una tabla para determinar marcas de tiempo en un determinado trimestre de un año?',
    choices: [
      { id: 'a', text: 'id_tiempo, anio, trimestre', correct: true },
      { id: 'b', text: 'monto_total, id_cliente', correct: false },
      { id: 'c', text: 'nombre_sucursal, ciudad', correct: false },
    ],
    explanation: 'Para filtrar por tiempo necesitamos los atributos de la dimensión Tiempo como anio y trimestre.',
  }
]
