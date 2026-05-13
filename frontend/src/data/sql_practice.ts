export type SqlDifficulty = 'facil' | 'intermedio' | 'avanzado' | 'reto'

export interface SqlPractice {
  id: string
  difficulty: SqlDifficulty
  title: string
  description: string
  objective: string
  hint: string
  referenceQuery: string
  schema?: string // Para mostrar el contexto de las tablas
}

export const sqlPracticeData: SqlPractice[] = [
  {
    id: 'sql_basic_1',
    difficulty: 'facil',
    title: 'Repaso: Selección de Base de Datos e Inserción',
    description: 'En Data Warehousing, antes de cargar hechos, a veces necesitamos preparar tablas temporales o de staging.',
    objective: 'Escribí una sentencia para seleccionar la base de datos "STAGING_DWH" e insertá un registro en la tabla "TMP_VENTAS" con las columnas id_venta (1) y monto (500).',
    hint: 'Usá USE <db>; y luego INSERT INTO <tabla> (cols) VALUES (vals);',
    referenceQuery: 'USE STAGING_DWH;\nINSERT INTO TMP_VENTAS (id_venta, monto) VALUES (1, 500);',
  },
  {
    id: 'sql_join_1',
    difficulty: 'intermedio',
    title: 'Dominando los JOINS: Hechos y Dimensiones',
    description: 'La esencia del SQL analítico es unir la tabla FACT con sus dimensiones.',
    objective: 'Consultá el total de ventas (monto) de la tabla FACT_VENTAS uniendo con la dimensión Dim_Producto para filtrar solo los productos de la categoría "Electrónica".',
    hint: 'Necesitás un JOIN entre FACT_VENTAS (fv) y Dim_Producto (p) por id_producto. Usá SUM() y WHERE p.categoria = "Electrónica".',
    referenceQuery: 'SELECT SUM(fv.monto) FROM FACT_VENTAS fv JOIN Dim_Producto p ON fv.id_producto = p.id_producto WHERE p.categoria = "Electrónica";',
  },
  {
    id: 'sql_dwh_1',
    difficulty: 'reto',
    title: 'Reto: Creación de un Data Warehouse (5D + 1F)',
    description: 'Simularemos la creación de la estructura base para un DWH de Retail.',
    objective: 'Escribí el DDL para crear una tabla de hechos FACT_RETAIL que se conecte con 5 dimensiones: Tiempo, Producto, Sucursal, Cliente y Promocion. Incluí al menos dos métricas: cantidad y monto_neto.',
    hint: 'La tabla FACT debe tener 5 llaves foráneas (FK) que apunten a las PKs de las dimensiones, más las columnas de medidas.',
    referenceQuery: `CREATE TABLE FACT_RETAIL (
  id_tiempo INT,
  id_producto INT,
  id_sucursal INT,
  id_cliente INT,
  id_promocion INT,
  cantidad INT,
  monto_neto DECIMAL(18,2),
  FOREIGN KEY (id_tiempo) REFERENCES Dim_Tiempo(id_tiempo),
  FOREIGN KEY (id_producto) REFERENCES Dim_Producto(id_producto),
  FOREIGN KEY (id_sucursal) REFERENCES Dim_Sucursal(id_sucursal),
  FOREIGN KEY (id_cliente) REFERENCES Dim_Cliente(id_cliente),
  FOREIGN KEY (id_promocion) REFERENCES Dim_Promocion(id_promocion)
);`,
  }
]
