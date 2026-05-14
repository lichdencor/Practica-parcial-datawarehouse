// Schemas SQLite + datos de prueba para ejecución in-browser con sql.js.
// Cada constante crea las tablas y carga filas representativas.

export const SCHEMA_P8 = `
CREATE TABLE Dim_Categoria (id_categoria INTEGER PRIMARY KEY, nombre_cat TEXT);
INSERT INTO Dim_Categoria VALUES (1,'Electrónica'),(2,'Ropa'),(3,'Alimentos');

CREATE TABLE Dim_Marca (id_marca INTEGER PRIMARY KEY, nombre_mar TEXT);
INSERT INTO Dim_Marca VALUES (1,'Samsung'),(2,'Nike'),(3,'Nestlé');

CREATE TABLE Dim_Producto (id_producto INTEGER PRIMARY KEY, id_categoria INTEGER, id_marca INTEGER, nombre_prod TEXT);
INSERT INTO Dim_Producto VALUES (1,1,1,'Celular'),(2,2,2,'Zapatillas'),(3,3,3,'Chocolate');

CREATE TABLE Dim_Sucursal (id_sucursal INTEGER PRIMARY KEY, nombre_suc TEXT);
INSERT INTO Dim_Sucursal VALUES (1,'Centro'),(2,'Norte');

CREATE TABLE Dim_Empleado (id_empleado INTEGER PRIMARY KEY, id_sucursal INTEGER, nombre_emp TEXT);
INSERT INTO Dim_Empleado VALUES (1,1,'Ana García'),(2,2,'Luis Pérez');

CREATE TABLE Dim_Cliente (id_cliente INTEGER PRIMARY KEY, nombre TEXT);
INSERT INTO Dim_Cliente VALUES (1,'María López'),(2,'Carlos Ruiz');

CREATE TABLE Dim_Tiempo (id_tiempo INTEGER PRIMARY KEY, anio INTEGER, trimestre INTEGER, mes INTEGER);
INSERT INTO Dim_Tiempo VALUES (1,2023,1,1),(2,2023,1,2),(3,2023,2,4),(4,2022,4,12);

CREATE TABLE FACT_VENTA_FACTURA (
  id_venta INTEGER PRIMARY KEY,
  id_producto INTEGER, id_empleado INTEGER, id_cliente INTEGER, id_tiempo INTEGER,
  total_ventas REAL, cantidad INTEGER
);
INSERT INTO FACT_VENTA_FACTURA VALUES
  (1,1,1,1,1,15000,2),(2,1,1,2,2,7500,1),(3,2,2,1,3,12000,3),
  (4,3,1,2,4,5000,5),(5,2,2,2,1,8000,2),(6,1,2,1,3,22000,4);
`

export const SCHEMA_P10 = `
CREATE TABLE Dim_Producto (codigo TEXT PRIMARY KEY, nombre TEXT, categoria TEXT);
INSERT INTO Dim_Producto VALUES
  ('P001','Laptop','Tecnología'),('P002','Silla','Muebles'),('P003','Arroz','Alimentos');

CREATE TABLE Dim_Bodega (codigo TEXT PRIMARY KEY, nombre TEXT);
INSERT INTO Dim_Bodega VALUES ('B001','Bodega Central'),('B002','Bodega Norte');

CREATE TABLE Dim_Tiempo (id_tiempo INTEGER PRIMARY KEY, anio INTEGER, trimestre INTEGER, mes INTEGER);
INSERT INTO Dim_Tiempo VALUES (1,2023,1,1),(2,2023,2,4),(3,2022,4,12),(4,2023,3,8);

CREATE TABLE Dim_Cliente (cedula TEXT PRIMARY KEY, nombre TEXT);
INSERT INTO Dim_Cliente VALUES ('123','Juan Torres'),('456','Ana Silva');

CREATE TABLE Dim_Proveedor (nit TEXT PRIMARY KEY, nombre TEXT);
INSERT INTO Dim_Proveedor VALUES ('P001','TechCorp'),('P002','MueblesCo');

CREATE TABLE FACT_VENTAS (
  id_venta INTEGER PRIMARY KEY,
  producto_codigo TEXT, bodega_codigo TEXT, cliente_cedula TEXT,
  id_tiempo INTEGER, cantidad INTEGER, valor_neto REAL
);
INSERT INTO FACT_VENTAS VALUES
  (1,'P001','B001','123',1,2,3000000),(2,'P001','B002','456',2,1,1500000),
  (3,'P002','B001','123',3,5,2500000),(4,'P003','B002','456',4,10,500000),
  (5,'P001','B001','456',1,3,4500000),(6,'P002','B002','123',2,2,1000000);
`

// Práctica: JOIN básico FACT_VENTAS + Dim_Producto
export const SCHEMA_JOIN1 = `
CREATE TABLE FACT_VENTAS (id_venta INTEGER PRIMARY KEY, monto REAL, id_producto INTEGER);
INSERT INTO FACT_VENTAS VALUES (1,5000,1),(2,3000,2),(3,8000,1),(4,2000,3);

CREATE TABLE Dim_Producto (id_producto INTEGER PRIMARY KEY, categoria TEXT, nombre TEXT);
INSERT INTO Dim_Producto VALUES (1,'Electrónica','Celular'),(2,'Ropa','Camiseta'),(3,'Electrónica','Tablet');
`

// Práctica: INSERT básico en tabla staging
export const SCHEMA_BASIC1 = `
CREATE TABLE TMP_VENTAS (id_venta INTEGER, monto REAL);
`

// Práctica: DDL reto — dimensiones auxiliares para crear FACT_RETAIL
export const SCHEMA_DWH1 = `
CREATE TABLE Dim_Tiempo     (id_tiempo   INTEGER PRIMARY KEY);
CREATE TABLE Dim_Producto   (id_producto INTEGER PRIMARY KEY);
CREATE TABLE Dim_Sucursal   (id_sucursal INTEGER PRIMARY KEY);
CREATE TABLE Dim_Cliente    (id_cliente  INTEGER PRIMARY KEY);
CREATE TABLE Dim_Promocion  (id_promocion INTEGER PRIMARY KEY);
`

// Named lookup — set "schemaRef": "P8" (or "P10", "JOIN1", etc.) in MongoDB exercises
// instead of embedding the full SQL string in the document.
export const SCHEMAS: Record<string, string> = {
  P8:     SCHEMA_P8,
  P10:    SCHEMA_P10,
  JOIN1:  SCHEMA_JOIN1,
  BASIC1: SCHEMA_BASIC1,
  DWH1:   SCHEMA_DWH1,
}
