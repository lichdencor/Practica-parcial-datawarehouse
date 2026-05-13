export interface QuickPractice {
  id: string
  tableName: string
  columns: string[]
  correctType: 'fact' | 'dimension'
  explanation: string
}

export const quickPracticeData: QuickPractice[] = [
  {
    id: 'p1',
    tableName: 'Ventas_Anuales',
    columns: ['id_venta', 'monto_total', 'id_cliente', 'id_fecha', 'cantidad'],
    correctType: 'fact',
    explanation: 'Contiene medidas cuantificables (monto, cantidad) y claves foráneas a dimensiones.',
  },
  {
    id: 'p2',
    tableName: 'Dim_Productos',
    columns: ['id_producto', 'nombre_comercial', 'categoria', 'marca', 'precio_unitario_ref'],
    correctType: 'dimension',
    explanation: 'Describe las características de una entidad de negocio (producto).',
  },
  {
    id: 'p3',
    tableName: 'Fact_Presupuesto',
    columns: ['id_area', 'id_mes', 'monto_asignado', 'monto_ejecutado'],
    correctType: 'fact',
    explanation: 'Almacena hechos numéricos (montos) para ser analizados por área y tiempo.',
  },
  {
    id: 'p4',
    tableName: 'Sucursales',
    columns: ['id_sucursal', 'nombre_suc', 'ciudad', 'region', 'gerente_nombre'],
    correctType: 'dimension',
    explanation: 'Provee el contexto geográfico y administrativo de donde ocurren los hechos.',
  },
]
