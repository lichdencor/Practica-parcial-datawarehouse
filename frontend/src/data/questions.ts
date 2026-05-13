export interface Choice {
  id: string
  text: string
  correct: boolean
}

export interface Question {
  id: string
  text: string
  choices: Choice[]
  explanation: string
}

export interface DwhTable {
  name: string
  type: 'fact' | 'dimension' | 'dimension2'
  columns: Array<{ name: string; role?: 'pk' | 'fk' | 'measure' }>
  x: number
  y: number
}

export interface DwhDiagramConfig {
  title: string
  description: string
  tables: DwhTable[]
  connections: Array<{ from: string; to: string }>
}

export interface SqlExercise {
  id: string
  metric: string
  description: string
  dimensions: string[]
  hint: string
  referenceQuery: string
}

export interface ExamSection {
  id: number
  title: string
  subtitle: string
  type: 'multiple-choice' | 'dwh-diagram' | 'sql-shell'
  theory?: string
  questions?: Question[]
  diagram?: DwhDiagramConfig
  sqlExercises?: SqlExercise[]
}

export const examSections: ExamSection[] = [
  // ─── PUNTO 1 ────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Punto 1',
    subtitle: 'Diferencia entre OLAP y OLTP',
    type: 'multiple-choice',
    questions: [
      {
        id: 'q1a',
        text: '¿Cuál de los siguientes sistemas está diseñado para el análisis de grandes volúmenes de datos históricos?',
        choices: [
          { id: 'a', text: 'OLTP, porque procesa transacciones de manera óptima', correct: false },
          { id: 'b', text: 'OLAP, porque permite extraer información para análisis complejos', correct: true },
          { id: 'c', text: 'Ambos sistemas son equivalentes para análisis histórico', correct: false },
          { id: 'd', text: 'OLAP solo sirve para operaciones simples de inserción', correct: false },
        ],
        explanation: 'OLAP está diseñado específicamente para análisis sobre datos históricos de una o más fuentes, mientras que OLTP maneja datos operativos actuales.',
      },
      {
        id: 'q1b',
        text: '¿Qué afirmación sobre la normalización es correcta?',
        choices: [
          { id: 'a', text: 'Las tablas OLAP están normalizadas hasta 3FN', correct: false },
          { id: 'b', text: 'Las tablas OLTP no están normalizadas', correct: false },
          { id: 'c', text: 'Las tablas OLAP no están normalizadas; las OLTP sí hasta 3FN', correct: true },
          { id: 'd', text: 'Ambos sistemas evitan la normalización', correct: false },
        ],
        explanation: 'OLAP usa modelos dimensionales (desnormalizados) para optimizar las consultas analíticas. OLTP requiere normalización hasta 3FN para evitar anomalías en las transacciones.',
      },
      {
        id: 'q1c',
        text: '¿Qué caracteriza a las transacciones en un sistema OLTP?',
        choices: [
          { id: 'a', text: 'Son poco frecuentes pero muy largas y complejas', correct: false },
          { id: 'b', text: 'Las consultas pueden tardar horas debido al volumen de datos', correct: false },
          { id: 'c', text: 'Son muy frecuentes, rápidas y cortas', correct: true },
          { id: 'd', text: 'Son ejecutadas solo por analistas de datos', correct: false },
        ],
        explanation: 'OLTP maneja un gran número de transacciones cortas en tiempo real (inserts, updates, deletes), como las que hace un cajero o un sistema de reservas.',
      },
    ],
  },

  // ─── PUNTO 2 ────────────────────────────────────────────────────────────────
  {
    id: 2,
    title: 'Punto 2',
    subtitle: 'FACT vs Dimension y tratamiento histórico',
    type: 'multiple-choice',
    questions: [
      {
        id: 'q2a',
        text: '¿Qué tipo de dato almacenan principalmente las tablas de FACT?',
        choices: [
          { id: 'a', text: 'Datos descriptivos como nombres y categorías', correct: false },
          { id: 'b', text: 'Datos medibles y cuantificables (ventas, cantidades, montos)', correct: true },
          { id: 'c', text: 'Metadatos del sistema de base de datos', correct: false },
          { id: 'd', text: 'Registros de configuración de la organización', correct: false },
        ],
        explanation: 'Las tablas FACT almacenan hechos numéricos y cuantificables que pueden ser analizados: totales de ventas, cantidades de productos, etc.',
      },
      {
        id: 'q2b',
        text: '¿Qué técnica se utiliza para el tratamiento histórico de las Dimensiones?',
        choices: [
          { id: 'a', text: 'ETL (Extract, Transform, Load)', correct: false },
          { id: 'b', text: 'OLAP (Online Analytical Processing)', correct: false },
          { id: 'c', text: 'SCD (Slowly Changing Dimensions)', correct: true },
          { id: 'd', text: 'Normalización hasta 3FN', correct: false },
        ],
        explanation: 'Las SCD definen reglas para manejar los cambios en las dimensiones, ya sea sobrescribiendo registros (SCD tipo 1), manteniendo historial completo (SCD tipo 2) o guardando versiones (SCD tipo 3).',
      },
      {
        id: 'q2c',
        text: '¿Cómo se gestiona el historial en las tablas de FACT?',
        choices: [
          { id: 'a', text: 'Usando Slowly Changing Dimensions sobre los hechos', correct: false },
          { id: 'b', text: 'Mediante versionado temporal: cada registro tiene un rango de tiempo de validez', correct: true },
          { id: 'c', text: 'Los hechos no tienen tratamiento histórico', correct: false },
          { id: 'd', text: 'Eliminando registros antiguos periódicamente', correct: false },
        ],
        explanation: 'Las tablas FACT usan un enfoque de versión temporal donde cada registro tiene un timestamp o rango de tiempo que indica cuándo fue válido, permitiendo análisis históricos.',
      },
    ],
  },

  // ─── PUNTO 3 ────────────────────────────────────────────────────────────────
  {
    id: 3,
    title: 'Punto 3',
    subtitle: 'Técnicas de diseño de FACTs en Data Warehousing',
    type: 'multiple-choice',
    questions: [
      {
        id: 'q3a',
        text: '¿Qué tipo de medida puede sumarse a través de TODAS las dimensiones?',
        choices: [
          { id: 'a', text: 'Semiaditiva', correct: false },
          { id: 'b', text: 'No aditiva', correct: false },
          { id: 'c', text: 'Aditiva', correct: true },
          { id: 'd', text: 'Derivada', correct: false },
        ],
        explanation: 'Las medidas aditivas pueden sumarse en todas las dimensiones sin restricción, como el total de ventas (se puede sumar por tiempo, por producto, por región, etc.).',
      },
      {
        id: 'q3b',
        text: '¿Cuál es un ejemplo de medida NO aditiva?',
        choices: [
          { id: 'a', text: 'Total de ventas en dinero', correct: false },
          { id: 'b', text: 'Cantidad de productos vendidos', correct: false },
          { id: 'c', text: 'Porcentaje de margen de ganancia', correct: true },
          { id: 'd', text: 'Número de transacciones', correct: false },
        ],
        explanation: 'Los porcentajes y ratios son medidas no aditivas porque sumar porcentajes no produce un resultado significativo. Requieren enfoques especiales como promediar o recalcular.',
      },
      {
        id: 'q3c',
        text: '¿Qué es una "factless fact table"?',
        choices: [
          { id: 'a', text: 'Una tabla de hechos con todos sus valores en NULL', correct: false },
          { id: 'b', text: 'Una tabla que registra qué entidades dimensionales se unen en un momento específico, sin métricas numéricas', correct: true },
          { id: 'c', text: 'Una tabla de dimensiones mal categorizada', correct: false },
          { id: 'd', text: 'Una tabla temporal que se elimina después del ETL', correct: false },
        ],
        explanation: 'Las factless fact tables capturan la ocurrencia de un evento (qué entidades participaron y cuándo) sin necesitar valores numéricos. Ejemplo: qué estudiante asistió a qué clase en qué día.',
      },
    ],
  },

  // ─── PUNTO 4 ────────────────────────────────────────────────────────────────
  {
    id: 4,
    title: 'Punto 4',
    subtitle: 'Técnicas de dimensiones en Data Warehousing',
    type: 'multiple-choice',
    questions: [
      {
        id: 'q4a',
        text: '¿Qué es una dimensión degenerada?',
        choices: [
          { id: 'a', text: 'Una dimensión obsoleta que ya no se usa en el DWH', correct: false },
          { id: 'b', text: 'Un atributo que se incorpora directamente en la tabla de hechos sin tabla de dimensión propia', correct: true },
          { id: 'c', text: 'Una dimensión con valores NULL en todos sus atributos', correct: false },
          { id: 'd', text: 'Una dimensión que no tiene clave primaria definida', correct: false },
        ],
        explanation: 'La dimensión degenerada es una dimensión que existe lógicamente pero que, por tener pocos atributos o ser identificada directamente en el hecho, se almacena como un atributo de la tabla de hechos (ej: número de orden de compra).',
      },
      {
        id: 'q4b',
        text: '¿Por qué se crean claves duraderas (surrogate keys) en el DWH en lugar de usar las claves naturales del sistema fuente?',
        choices: [
          { id: 'a', text: 'Para acelerar las consultas mediante índices más pequeños', correct: false },
          { id: 'b', text: 'Porque las claves naturales pueden cambiar por reglas comerciales, y las surrogate garantizan unicidad y durabilidad', correct: true },
          { id: 'c', text: 'Para ocultar información sensible de los datos fuente', correct: false },
          { id: 'd', text: 'Para normalizar las tablas de dimensiones a 3FN', correct: false },
        ],
        explanation: 'Las claves naturales del sistema fuente pueden cambiar (un cliente puede cambiar de número de cliente). Las surrogate keys son independientes del sistema fuente y permanecen estables aunque los datos cambien.',
      },
      {
        id: 'q4c',
        text: '¿Qué tipo de valor debe evitarse en los atributos de una tabla de dimensiones?',
        choices: [
          { id: 'a', text: 'Claves foráneas', correct: false },
          { id: 'b', text: 'Valores NULL', correct: true },
          { id: 'c', text: 'Strings de texto largos', correct: false },
          { id: 'd', text: 'Fechas históricas', correct: false },
        ],
        explanation: 'Los valores NULL en dimensiones causan problemas de consistencia en las consultas analíticas. Se recomienda usar valores por defecto como "N/A" o "Desconocido" en lugar de NULL.',
      },
    ],
  },

  // ─── PUNTO 5 ────────────────────────────────────────────────────────────────
  {
    id: 5,
    title: 'Punto 5',
    subtitle: 'Técnicas de modelado en Data Warehousing',
    type: 'multiple-choice',
    questions: [
      {
        id: 'q5a',
        text: '¿Qué esquemas utiliza el modelado dimensional en Data Warehousing?',
        choices: [
          { id: 'a', text: 'Relacional y jerárquico', correct: false },
          { id: 'b', text: 'Estrella (star schema) y copo de nieve (snowflake schema)', correct: true },
          { id: 'c', text: 'OLAP y OLTP', correct: false },
          { id: 'd', text: 'Entidad-Relación y objeto-relacional', correct: false },
        ],
        explanation: 'El modelado dimensional se implementa mediante el esquema estrella (una tabla de hechos central con dimensiones desnormalizadas) o el copo de nieve (dimensiones normalizadas en múltiples niveles).',
      },
      {
        id: 'q5b',
        text: '¿Cuáles son los tres conceptos básicos del modelado dimensional?',
        choices: [
          { id: 'a', text: 'Tablas, filas y columnas', correct: false },
          { id: 'b', text: 'Entidades, relaciones y atributos', correct: false },
          { id: 'c', text: 'Medidas, hechos y dimensiones', correct: true },
          { id: 'd', text: 'Cubos, jerarquías y métricas de rendimiento', correct: false },
        ],
        explanation: 'El modelado dimensional se basa en: medidas (los valores a analizar), hechos (las tablas que contienen las medidas) y dimensiones (las perspectivas desde las que se analizan los hechos).',
      },
      {
        id: 'q5c',
        text: '¿Qué define la granularidad en el diseño de un DWH?',
        choices: [
          { id: 'a', text: 'El número de tablas en el esquema estrella', correct: false },
          { id: 'b', text: 'La versión del sistema gestor de base de datos', correct: false },
          { id: 'c', text: 'El nivel de detalle de los hechos almacenados en las tablas FACT', correct: true },
          { id: 'd', text: 'La cantidad de índices creados sobre las dimensiones', correct: false },
        ],
        explanation: 'La granularidad determina qué tan detallados son los registros de la tabla de hechos. Granularidad fina = más detalle (una fila por transacción individual). Granularidad gruesa = menos detalle (una fila por día, por ejemplo).',
      },
    ],
  },

  // ─── PUNTO 6 ────────────────────────────────────────────────────────────────
  {
    id: 6,
    title: 'Punto 6',
    subtitle: 'Formas de diseño de dimensiones',
    type: 'multiple-choice',
    questions: [
      {
        id: 'q6a',
        text: '¿Qué tipo de dimensión garantiza consistencia al ser compartida en todo el Data Warehouse?',
        choices: [
          { id: 'a', text: 'Dimensión Degenerada', correct: false },
          { id: 'b', text: 'Dimensión Jerárquica', correct: false },
          { id: 'c', text: 'Dimensión Conformada', correct: true },
          { id: 'd', text: 'Dimensión de Despliegue Simple', correct: false },
        ],
        explanation: 'Las dimensiones conformadas son dimensiones que se definen una sola vez y se reutilizan en múltiples tablas de hechos y áreas del DWH, garantizando definiciones consistentes (ej: Dim_Tiempo usada en ventas, compras y logística).',
      },
      {
        id: 'q6b',
        text: '¿Qué tipo de dimensión gestiona cambios en datos descriptivos con el tiempo (ej: cambio de dirección de un cliente)?',
        choices: [
          { id: 'a', text: 'Dimensión Jerárquica', correct: false },
          { id: 'b', text: 'Dimensión Conformada', correct: false },
          { id: 'c', text: 'Dimensión SCD (Slowly Changing Dimension)', correct: true },
          { id: 'd', text: 'Dimensión Degenerada', correct: false },
        ],
        explanation: 'Las SCD (Slowly Changing Dimensions) definen estrategias para gestionar los cambios en atributos de dimensión que cambian lentamente con el tiempo, manteniendo o no el historial según el tipo (1, 2 o 3).',
      },
      {
        id: 'q6c',
        text: 'Una dimensión "Tiempo" con niveles Año → Trimestre → Mes → Día es un ejemplo de:',
        choices: [
          { id: 'a', text: 'Dimensión de Despliegue Simple', correct: false },
          { id: 'b', text: 'Dimensión Jerárquica', correct: true },
          { id: 'c', text: 'Dimensión Degenerada', correct: false },
          { id: 'd', text: 'Dimensión SCD Tipo 2', correct: false },
        ],
        explanation: 'Las dimensiones jerárquicas representan niveles de granularidad relacionados que permiten hacer drill-down (de año a mes) o roll-up (de día a trimestre) en los análisis.',
      },
    ],
  },

  // ─── PUNTO 7 ────────────────────────────────────────────────────────────────
  {
    id: 7,
    title: 'Punto 7',
    subtitle: 'Modelo DWH — Sistema de Ventas y Compras',
    type: 'dwh-diagram',
    diagram: {
      title: 'Star/Snowflake Schema — Sistema de Ventas',
      description: 'Modelo DWH derivado del sistema operativo de ventas y compras',
      tables: [
        {
          name: 'FACT_VENTA_FACTURA',
          type: 'fact',
          columns: [
            { name: 'id_venta', role: 'pk' },
            { name: 'id_producto', role: 'fk' },
            { name: 'id_cliente', role: 'fk' },
            { name: 'id_empleado', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'total_ventas', role: 'measure' },
            { name: 'cantidad', role: 'measure' },
            { name: 'nro_factura' },
          ],
          x: 390, y: 250,
        },
        {
          name: 'Dim_Producto',
          type: 'dimension',
          columns: [
            { name: 'id_producto', role: 'pk' },
            { name: 'nombre_prod' },
            { name: 'id_categoria', role: 'fk' },
            { name: 'id_marca', role: 'fk' },
          ],
          x: 50, y: 120,
        },
        {
          name: 'Dim_Cliente',
          type: 'dimension',
          columns: [
            { name: 'id_cliente', role: 'pk' },
            { name: 'nombre' },
            { name: 'direccion' },
          ],
          x: 680, y: 120,
        },
        {
          name: 'Dim_Empleado',
          type: 'dimension',
          columns: [
            { name: 'id_empleado', role: 'pk' },
            { name: 'nombre_emp' },
            { name: 'id_sucursal', role: 'fk' },
          ],
          x: 680, y: 350,
        },
        {
          name: 'Dim_Tiempo',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'anio' },
            { name: 'trimestre' },
            { name: 'mes' },
            { name: 'dia' },
          ],
          x: 390, y: 480,
        },
        {
          name: 'Dim_Categoria',
          type: 'dimension2',
          columns: [
            { name: 'id_categoria', role: 'pk' },
            { name: 'nombre_cat' },
          ],
          x: 50, y: -40,
        },
        {
          name: 'Dim_Marca',
          type: 'dimension2',
          columns: [
            { name: 'id_marca', role: 'pk' },
            { name: 'nombre_mar' },
          ],
          x: 240, y: -40,
        },
        {
          name: 'Dim_Sucursal',
          type: 'dimension2',
          columns: [
            { name: 'id_sucursal', role: 'pk' },
            { name: 'nombre_suc' },
            { name: 'ciudad' },
          ],
          x: 880, y: 350,
        },
      ],
      connections: [
        { from: 'FACT_VENTA_FACTURA', to: 'Dim_Producto' },
        { from: 'FACT_VENTA_FACTURA', to: 'Dim_Cliente' },
        { from: 'FACT_VENTA_FACTURA', to: 'Dim_Empleado' },
        { from: 'FACT_VENTA_FACTURA', to: 'Dim_Tiempo' },
        { from: 'Dim_Producto', to: 'Dim_Categoria' },
        { from: 'Dim_Producto', to: 'Dim_Marca' },
        { from: 'Dim_Empleado', to: 'Dim_Sucursal' },
      ],
    },
  },

  // ─── PUNTO 8 ────────────────────────────────────────────────────────────────
  {
    id: 8,
    title: 'Punto 8',
    subtitle: 'Métricas SQL — Sistema de Ventas',
    type: 'sql-shell',
    sqlExercises: [
      {
        id: 'p8m1',
        metric: 'Métrica 1: Ventas totales por categoría y marca',
        description: 'Calcular las ventas totales agrupadas por categoría y marca de productos. Usar: Dim_Producto, Dim_Categoria, Dim_Marca y FACT_VENTA_FACTURA.',
        dimensions: ['Dim_Categoria', 'Dim_Marca', 'Dim_Producto'],
        hint: 'Necesitás JOINs encadenados: FACT → Dim_Producto → Dim_Categoria y Dim_Marca. Usá SUM() y GROUP BY.',
        referenceQuery: `SELECT
  c.nombre_cat   AS categoria,
  m.nombre_mar   AS marca,
  SUM(vf.total_ventas) AS ventas_totales
FROM FACT_VENTA_FACTURA vf
  JOIN Dim_Producto  p ON vf.id_producto  = p.id_producto
  JOIN Dim_Categoria c ON p.id_categoria  = c.id_categoria
  JOIN Dim_Marca     m ON p.id_marca      = m.id_marca
GROUP BY c.nombre_cat, m.nombre_mar
ORDER BY categoria, marca;`,
      },
      {
        id: 'p8m2',
        metric: 'Métrica 2: Ventas promedio por sucursal, empleado y cliente',
        description: 'Calcular el promedio de ventas agrupado por sucursal, empleado y cliente. Usar: Dim_Empleado, Dim_Sucursal, Dim_Cliente y FACT_VENTA_FACTURA.',
        dimensions: ['Dim_Sucursal', 'Dim_Empleado', 'Dim_Cliente'],
        hint: 'Hacé JOIN de FACT con Dim_Empleado → Dim_Sucursal y con Dim_Cliente. Usá AVG() sobre total_ventas.',
        referenceQuery: `SELECT
  s.nombre_suc   AS sucursal,
  e.nombre_emp   AS empleado,
  c.nombre       AS cliente,
  AVG(vf.total_ventas) AS ventas_promedio
FROM FACT_VENTA_FACTURA vf
  JOIN Dim_Empleado e  ON vf.id_empleado = e.id_empleado
  JOIN Dim_Sucursal s  ON e.id_sucursal  = s.id_sucursal
  JOIN Dim_Cliente  c  ON vf.id_cliente  = c.id_cliente
GROUP BY s.nombre_suc, e.nombre_emp, c.nombre
ORDER BY sucursal, empleado, cliente;`,
      },
      {
        id: 'p8m3',
        metric: 'Métrica 3: Total de ventas por año y trimestre',
        description: 'Analizar la evolución temporal de las ventas totales y la cantidad de transacciones. Usar: Dim_Tiempo, Dim_Producto y FACT_VENTA_FACTURA.',
        dimensions: ['Dim_Tiempo', 'Dim_Producto', 'Dim_Categoria'],
        hint: 'Usá Dim_Tiempo para el período y hacé GROUP BY anio y trimestre. Podés agregar la dimensión de producto para más detalle.',
        referenceQuery: `SELECT
  t.anio,
  t.trimestre,
  c.nombre_cat        AS categoria,
  SUM(vf.total_ventas) AS ventas_totales,
  SUM(vf.cantidad)     AS unidades_vendidas
FROM FACT_VENTA_FACTURA vf
  JOIN Dim_Tiempo    t ON vf.id_tiempo   = t.id_tiempo
  JOIN Dim_Producto  p ON vf.id_producto = p.id_producto
  JOIN Dim_Categoria c ON p.id_categoria = c.id_categoria
GROUP BY t.anio, t.trimestre, c.nombre_cat
ORDER BY t.anio, t.trimestre, categoria;`,
      },
    ],
  },

  // ─── PUNTO 9 ────────────────────────────────────────────────────────────────
  {
    id: 9,
    title: 'Punto 9',
    subtitle: 'Modelo DWH — Sistema de Facturación y Bodegas',
    type: 'dwh-diagram',
    diagram: {
      title: 'Star Schema — Sistema de Facturación y Bodegas',
      description: 'Modelo DWH derivado del sistema de facturación con gestión de bodegas',
      tables: [
        {
          name: 'FACT_VENTAS',
          type: 'fact',
          columns: [
            { name: 'id_venta', role: 'pk' },
            { name: 'producto_codigo', role: 'fk' },
            { name: 'bodega_codigo', role: 'fk' },
            { name: 'cliente_cedula', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'valor_neto', role: 'measure' },
            { name: 'cantidad', role: 'measure' },
          ],
          x: 390, y: 270,
        },
        {
          name: 'Dim_Producto',
          type: 'dimension',
          columns: [
            { name: 'codigo', role: 'pk' },
            { name: 'nombre' },
            { name: 'categoria' },
            { name: 'precio_ref' },
          ],
          x: 60, y: 120,
        },
        {
          name: 'Dim_Bodega',
          type: 'dimension',
          columns: [
            { name: 'codigo', role: 'pk' },
            { name: 'nombre' },
            { name: 'ubicacion' },
          ],
          x: 680, y: 120,
        },
        {
          name: 'Dim_Cliente',
          type: 'dimension',
          columns: [
            { name: 'cedula', role: 'pk' },
            { name: 'nombre' },
            { name: 'ciudad' },
          ],
          x: 680, y: 380,
        },
        {
          name: 'Dim_Tiempo',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'anio' },
            { name: 'mes' },
            { name: 'dia' },
          ],
          x: 60, y: 380,
        },
        {
          name: 'Dim_Proveedor',
          type: 'dimension',
          columns: [
            { name: 'nit', role: 'pk' },
            { name: 'nombre' },
            { name: 'ciudad' },
          ],
          x: 390, y: 490,
        },
      ],
      connections: [
        { from: 'FACT_VENTAS', to: 'Dim_Producto' },
        { from: 'FACT_VENTAS', to: 'Dim_Bodega' },
        { from: 'FACT_VENTAS', to: 'Dim_Cliente' },
        { from: 'FACT_VENTAS', to: 'Dim_Tiempo' },
        { from: 'FACT_VENTAS', to: 'Dim_Proveedor' },
      ],
    },
  },

  // ─── PUNTO 10 ───────────────────────────────────────────────────────────────
  {
    id: 10,
    title: 'Punto 10',
    subtitle: 'Métricas SQL — Sistema de Facturación y Bodegas',
    type: 'sql-shell',
    sqlExercises: [
      {
        id: 'p10m1',
        metric: 'Métrica 1: Ventas totales por producto en una bodega durante un período',
        description: 'Calcular las ventas totales de productos por bodega durante un período dado. Usar: Dim_Producto, Dim_Bodega, Dim_Tiempo y FACT_VENTAS.',
        dimensions: ['Dim_Producto', 'Dim_Bodega', 'Dim_Tiempo'],
        hint: 'Filtrá por rango de fechas con WHERE y fecha BETWEEN. Usá SUM() de valor_neto. Agrupá por producto y bodega.',
        referenceQuery: `SELECT
  p.nombre        AS producto,
  b.nombre        AS bodega,
  SUM(f.valor_neto)   AS ventas_totales
FROM FACT_VENTAS f
  JOIN Dim_Producto p ON f.producto_codigo = p.codigo
  JOIN Dim_Bodega   b ON f.bodega_codigo   = b.codigo
  JOIN Dim_Tiempo   t ON f.id_tiempo       = t.id_tiempo
WHERE t.anio = 2023
GROUP BY p.nombre, b.nombre
ORDER BY ventas_totales DESC;`,
      },
      {
        id: 'p10m2',
        metric: 'Métrica 2: Valor total de compras por proveedor durante un año',
        description: 'Calcular el valor total de las compras realizadas a cada proveedor durante un año específico. Usar: Dim_Proveedor, Dim_Tiempo y FACT_VENTAS.',
        dimensions: ['Dim_Proveedor', 'Dim_Tiempo', 'Dim_Bodega'],
        hint: 'Filtrá por anio en Dim_Tiempo. Usá SUM() y GROUP BY proveedor. Podés agregar bodega para más detalle.',
        referenceQuery: `SELECT
  pr.nombre       AS proveedor,
  t.anio          AS anio,
  b.nombre        AS bodega,
  SUM(f.valor_neto)    AS valor_total_compras
FROM FACT_VENTAS f
  JOIN Dim_Proveedor pr ON f.producto_codigo = pr.nit
  JOIN Dim_Tiempo    t  ON f.id_tiempo       = t.id_tiempo
  JOIN Dim_Bodega    b  ON f.bodega_codigo   = b.codigo
WHERE t.anio = 2023
GROUP BY pr.nombre, t.anio, b.nombre
ORDER BY valor_total_compras DESC;`,
      },
      {
        id: 'p10m3',
        metric: 'Métrica 3: Promedio de ventas por cliente y categoría de producto',
        description: 'Calcular el promedio de ventas por cliente y categoría de producto. Usar: Dim_Cliente, Dim_Producto y FACT_VENTAS.',
        dimensions: ['Dim_Cliente', 'Dim_Producto', 'Dim_Bodega'],
        hint: 'Usá AVG() sobre valor_neto. Agrupá por cliente y categoría del producto. Podés agregar nombre del producto.',
        referenceQuery: `SELECT
  c.nombre         AS cliente,
  p.categoria      AS categoria_producto,
  p.nombre         AS producto,
  AVG(f.cantidad)      AS promedio_cantidad,
  AVG(f.valor_neto)    AS promedio_ventas
FROM FACT_VENTAS f
  JOIN Dim_Cliente  c ON f.cliente_cedula  = c.cedula
  JOIN Dim_Producto p ON f.producto_codigo = p.codigo
  JOIN Dim_Bodega   b ON f.bodega_codigo   = b.codigo
GROUP BY c.nombre, p.categoria, p.nombre
ORDER BY cliente, categoria_producto;`,
      },
    ],
  },
]
