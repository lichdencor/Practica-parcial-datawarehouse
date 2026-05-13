export interface Concept {
  id: string
  title: string
  content: string
}

export interface ConceptSubgroup {
  name: string
  concepts: Concept[]
}

export interface ConceptCategory {
  category: string
  subgroups?: ConceptSubgroup[]
  concepts?: Concept[]
}

export const theoryConcepts: ConceptCategory[] = [
  {
    category: 'Fundamental',
    concepts: [
      {
        id: 'olap-vs-oltp',
        title: 'OLAP vs OLTP',
        content: `
**OLAP** (Online Analytical Processing): sistema diseñado para análisis de grandes volúmenes de datos históricos. Las consultas son complejas, lentas y poco frecuentes. Las tablas **no** están normalizadas. Usuarios: científicos de datos, analistas estratégicos.

**OLTP** (Online Transactional Processing): sistema para ejecución de transacciones en tiempo real. Muchas transacciones cortas y rápidas (CRUD). Las tablas están normalizadas hasta **3FN**. Usuarios: cajeros, sistemas de punto de venta.
        `.trim(),
      },
    ],
  },
  {
    category: 'Modeling',
    subgroups: [
      {
        name: 'Hechos y Dimensiones',
        concepts: [
          {
            id: 'fact-vs-dimension',
            title: 'FACT vs Dimension',
            content: `
**FACT (Hechos):** representan eventos medibles de una organización. Sus datos son cuantitativos (ventas, cantidades, montos). Se almacenan en tablas de hechos. Tratamiento histórico: versionado temporal (cada registro tiene un rango de tiempo de validez).

**Dimension:** describen los hechos (quién, qué, dónde, cuándo). Sus datos son descriptivos. Tratamiento histórico: **Slowly Changing Dimensions (SCD)**, que define reglas para mantener el historial de cambios.
            `.trim(),
          },
          {
            id: 'fact-techniques',
            title: 'Técnicas de diseño de FACTs',
            content: `
Las medidas en tablas de hechos se clasifican en tres categorías:
- **Aditivas:** se pueden sumar en **todas** las dimensiones (ej: ventas totales).
- **Semiaditivas:** se suman en **algunas** dimensiones (ej: saldo de cuenta bancaria — no tiene sentido sumar entre clientes).
- **No aditivas:** como las razones/porcentajes, requieren enfoques especiales.

Tipos de tablas FACT:
- **Transacción:** un registro por evento individual.
- **Instantánea periódica:** resume eventos en períodos estándar (diario, mensual).
- **Instantánea acumulativa:** resume un proceso predecible con varios hitos.
- **Factless fact table:** registra qué entidades se unen en un momento sin métricas numéricas.
            `.trim(),
          },
        ],
      },
      {
        name: 'Dimensiones',
        concepts: [
          {
            id: 'dimension-techniques',
            title: 'Técnicas de dimensiones',
            content: `
Conceptos clave en el diseño de dimensiones:
- **Clave primaria única:** cada tabla de dimensiones tiene una sola PK usada como FK en la tabla de hechos.
- **Claves naturales vs. Claves duraderas (surrogate keys):** las naturales vienen del sistema fuente y pueden cambiar. Las surrogate keys son generadas en el DWH para garantizar unicidad y durabilidad.
- **Dimensión degenerada:** incorporada directamente en la tabla de hechos sin tabla propia (ej: número de factura).
- **Valores NULL:** deben evitarse en atributos de dimensión para garantizar consistencia.
            `.trim(),
          },
          {
            id: 'scd-types',
            title: 'Slowly Changing Dimensions (SCD)',
            content: `
Gestiona cambios en datos descriptivos a lo largo del tiempo (ej: dirección de un cliente).
- **SCD Tipo 1:** sobrescribe el valor anterior (sin historial).
- **SCD Tipo 2:** agrega una nueva fila con el nuevo valor (historial completo).
- **SCD Tipo 3:** columna adicional para el valor anterior (historial limitado).
            `.trim(),
          },
        ],
      },
      {
        name: 'Esquemas',
        concepts: [
          {
            id: 'modeling-techniques',
            title: 'Modelado Dimensional',
            content: `
Dos grandes técnicas de modelado en DWH:

**Modelado ER (Entidad-Relación):** produce un modelo usando dos conceptos: entidades y sus relaciones. Útil para capturar la estructura del negocio.

**Modelado Dimensional:** usa tres conceptos — medidas, hechos y dimensiones. Emplea esquemas **estrella** (star schema) o **copo de nieve** (snowflake schema). Es el más adecuado para DWH porque representa mejor las necesidades del usuario de negocio.

Técnicas avanzadas:
- **Dimensiones Cambiantes Lentamente (SCD):** gestión de datos históricos.
- **Modelos abstractos y genéricos:** reutilizables en varios proyectos DWH.
- **Granularidad:** define el nivel de detalle de los hechos almacenados.
            `.trim(),
          },
        ],
      },
    ],
  },
]
