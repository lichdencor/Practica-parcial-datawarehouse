export interface GlossaryEntry {
  id: string
  term: string
  definition: string
  category: string
  example?: string
}

export const glossaryData: GlossaryEntry[] = [
  {
    id: 'g_oltp',
    term: 'OLTP',
    definition: 'Online Transaction Processing. Sistemas diseñados para registrar operaciones del negocio en tiempo real: ventas, pedidos, pagos. Priorizan la consistencia y velocidad de escritura sobre grandes volúmenes de transacciones pequeñas.',
    category: 'Conceptos Base',
    example: 'Sistema de caja de un supermercado que registra cada venta al instante.',
  },
  {
    id: 'g_olap',
    term: 'OLAP',
    definition: 'Online Analytical Processing. Sistemas diseñados para el análisis multidimensional de grandes volúmenes de datos históricos. Priorizan la velocidad de lectura y la capacidad de agregar datos por múltiples dimensiones.',
    category: 'Conceptos Base',
    example: 'Análisis de ventas por trimestre, por región y por categoría de producto.',
  },
  {
    id: 'g_dwh',
    term: 'Data Warehouse',
    definition: 'Repositorio central de datos integrados, históricos y orientados al análisis. Los datos provienen de múltiples fuentes OLTP, se transforman para ser consistentes y se almacenan de forma optimizada para consultas analíticas.',
    category: 'Conceptos Base',
  },
  {
    id: 'g_datamart',
    term: 'Data Mart',
    definition: 'Subconjunto de un Data Warehouse orientado a un área específica del negocio (ventas, finanzas, recursos humanos). Más pequeño y enfocado que el DWH completo.',
    category: 'Conceptos Base',
    example: 'Data Mart de Marketing con datos de campañas y conversiones.',
  },
  {
    id: 'g_etl',
    term: 'ETL',
    definition: 'Extract, Transform, Load. Proceso por el cual los datos se extraen de sistemas OLTP, se transforman (limpian, normalizan, enriquecen) y se cargan en el Data Warehouse. Es el "motor" que alimenta el DWH.',
    category: 'Conceptos Base',
  },
  {
    id: 'g_fact',
    term: 'Tabla de Hechos (FACT)',
    definition: 'Tabla central del modelo dimensional que almacena los eventos del negocio (transacciones, mediciones). Contiene métricas numéricas (medidas) y claves foráneas que apuntan a las tablas de dimensión.',
    category: 'Tablas',
    example: 'FACT_VENTAS con columnas: monto, cantidad, id_tiempo, id_producto, id_sucursal.',
  },
  {
    id: 'g_dim',
    term: 'Tabla de Dimensión (DIM)',
    definition: 'Tabla que describe el contexto de los hechos. Contiene atributos descriptivos (quién, qué, dónde, cuándo) y no métricas. Se usa para filtrar, agrupar y etiquetar los datos del FACT.',
    category: 'Tablas',
    example: 'Dim_Producto con nombre, categoría, marca, proveedor.',
  },
  {
    id: 'g_grain',
    term: 'Granularidad (Grain)',
    definition: 'Define exactamente qué representa una fila en la tabla de hechos. Determina el nivel de detalle almacenado. Es la decisión más importante en el diseño de un DWH.',
    category: 'Modelado',
    example: '"Una fila = una línea de factura" vs "una fila = total diario por producto".',
  },
  {
    id: 'g_star',
    term: 'Star Schema',
    definition: 'Esquema de modelado dimensional donde una tabla FACT central se conecta directamente con todas sus dimensiones sin normalizar. Las dimensiones son "planas" (desnormalizadas). Óptimo para queries analíticas.',
    category: 'Modelado',
  },
  {
    id: 'g_snowflake',
    term: 'Snowflake Schema',
    definition: 'Variante del Star Schema donde las dimensiones están normalizadas en sub-tablas. Reduce redundancia pero aumenta la complejidad de los JOINs. Útil cuando las dimensiones son muy grandes.',
    category: 'Modelado',
    example: 'Dim_Producto → Dim_Categoria → Dim_Division.',
  },
  {
    id: 'g_galaxy',
    term: 'Galaxy Schema',
    definition: 'También llamado Fact Constellation. Modelo con múltiples tablas FACT que comparten dimensiones. Permite analizar relaciones entre diferentes procesos del negocio.',
    category: 'Modelado',
    example: 'FACT_VENTAS y FACT_COMPRAS compartiendo Dim_Producto y Dim_Tiempo.',
  },
  {
    id: 'g_scd',
    term: 'SCD (Slowly Changing Dimension)',
    definition: 'Dimensión cuyos atributos cambian lentamente con el tiempo. Existen varios tipos: Tipo 1 (sobrescribe el valor anterior), Tipo 2 (agrega una nueva fila conservando el historial), Tipo 3 (agrega columna con valor anterior).',
    category: 'Tablas',
    example: 'Un cliente que cambia de ciudad: SCD Tipo 2 registra la ciudad anterior y la nueva con fechas.',
  },
  {
    id: 'g_surrogate',
    term: 'Surrogate Key',
    definition: 'Clave primaria artificial, generalmente numérica y auto-incremental, asignada en el DWH independientemente de la clave natural del sistema OLTP. Permite manejar SCDs y desacoplar el DWH de los sistemas fuente.',
    category: 'Tablas',
    example: 'id_producto = 1001 en el DWH aunque en el OLTP sea "PRD-SKU-ABC".',
  },
  {
    id: 'g_measure',
    term: 'Medida / Métrica',
    definition: 'Valor numérico almacenado en la tabla FACT que representa algo cuantificable del negocio. Puede ser aditiva (SUM sobre cualquier dimensión), semi-aditiva (SUM solo sobre algunas) o no-aditiva.',
    category: 'Tablas',
    example: 'monto_venta (aditiva), saldo_cuenta (semi-aditiva), precio_unitario (no-aditiva).',
  },
  {
    id: 'g_hierarchy',
    term: 'Jerarquía Dimensional',
    definition: 'Organización de los atributos de una dimensión en niveles de agregación, de lo más detallado a lo más general. Permite el análisis drill-down y roll-up.',
    category: 'Análisis',
    example: 'Tiempo: Día → Semana → Mes → Trimestre → Año.',
  },
  {
    id: 'g_drilldown',
    term: 'Drill Down / Roll Up',
    definition: 'Drill Down: navegar desde un nivel de agregación hacia uno más detallado en una jerarquía. Roll Up (o Drill Up): el movimiento inverso, subir en la jerarquía para ver datos más agregados.',
    category: 'Análisis',
    example: 'Drill Down: Ver ventas del año → ventas por mes → ventas por día.',
  },
  {
    id: 'g_conformed',
    term: 'Conformed Dimension',
    definition: 'Dimensión compartida y consistente entre múltiples tablas FACT o múltiples Data Marts. Permite comparar y combinar análisis de diferentes áreas del negocio usando la misma definición.',
    category: 'Tablas',
    example: 'Dim_Tiempo usada tanto en FACT_VENTAS como en FACT_PRODUCCION.',
  },
  {
    id: 'g_degenerate',
    term: 'FACT Degenerada',
    definition: 'Atributo que pertenece lógicamente a una dimensión pero se almacena directamente en la tabla FACT porque tiene alta cardinalidad o no tiene otros atributos descriptivos asociados.',
    category: 'Tablas',
    example: 'Número de factura o número de orden de compra almacenado en FACT_VENTAS.',
  },
]
