import type { DwhDiagramConfig } from './questions'

export interface OlapColumn {
  name: string
  type: string
  isPK?: boolean
  isFK?: boolean
}

export interface OlapTable {
  name: string
  columns: OlapColumn[]
}

export interface OlapToDwhExercise {
  id: string
  title: string
  description: string
  difficulty: 'facil' | 'intermedio' | 'avanzado'
  hint?: string
  olapTables: OlapTable[]
  expectedDwh: DwhDiagramConfig
}

export const olapToDwhExercises: OlapToDwhExercise[] = [
  // ── Ejercicio 1: Sistema de Ventas (Fácil) ─────────────────────────────────
  {
    id: 'olap_ventas',
    title: 'Sistema de Ventas',
    description:
      'Dado el modelo OLAP normalizado de un sistema de ventas minoristas, transformá las tablas en un esquema DWH estrella. Identificá la tabla de hechos, las dimensiones y las relaciones.',
    difficulty: 'facil',
    hint: 'La tabla VENTAS concentra los hechos cuantitativos (cantidad y monto). No te olvides de crear una dimensión DIM_TIEMPO derivada del campo fecha.',
    olapTables: [
      {
        name: 'CLIENTES',
        columns: [
          { name: 'id_cliente', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'ciudad', type: 'VARCHAR(50)' },
          { name: 'pais', type: 'VARCHAR(50)' },
        ],
      },
      {
        name: 'PRODUCTOS',
        columns: [
          { name: 'id_producto', type: 'INT', isPK: true },
          { name: 'descripcion', type: 'VARCHAR(150)' },
          { name: 'categoria', type: 'VARCHAR(50)' },
          { name: 'precio', type: 'DECIMAL(10,2)' },
        ],
      },
      {
        name: 'VENDEDORES',
        columns: [
          { name: 'id_vendedor', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'sucursal', type: 'VARCHAR(50)' },
        ],
      },
      {
        name: 'VENTAS',
        columns: [
          { name: 'id_venta', type: 'INT', isPK: true },
          { name: 'fecha', type: 'DATE' },
          { name: 'id_cliente', type: 'INT', isFK: true },
          { name: 'id_producto', type: 'INT', isFK: true },
          { name: 'id_vendedor', type: 'INT', isFK: true },
          { name: 'cantidad', type: 'INT' },
          { name: 'monto', type: 'DECIMAL(12,2)' },
        ],
      },
    ],
    expectedDwh: {
      title: 'Esquema DWH — Ventas',
      description: 'Modelo estrella con hechos de ventas y 4 dimensiones',
      tables: [
        {
          name: 'FACT_VENTAS',
          type: 'fact',
          columns: [
            { name: 'id_venta', role: 'pk' },
            { name: 'id_cliente', role: 'fk' },
            { name: 'id_producto', role: 'fk' },
            { name: 'id_vendedor', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'cantidad', role: 'measure' },
            { name: 'monto', role: 'measure' },
          ],
          x: 370, y: 230,
        },
        {
          name: 'DIM_CLIENTE',
          type: 'dimension',
          columns: [
            { name: 'id_cliente', role: 'pk' },
            { name: 'nombre' },
            { name: 'ciudad' },
            { name: 'pais' },
          ],
          x: 370, y: -30,
        },
        {
          name: 'DIM_PRODUCTO',
          type: 'dimension',
          columns: [
            { name: 'id_producto', role: 'pk' },
            { name: 'descripcion' },
            { name: 'categoria' },
            { name: 'precio' },
          ],
          x: 640, y: 230,
        },
        {
          name: 'DIM_VENDEDOR',
          type: 'dimension',
          columns: [
            { name: 'id_vendedor', role: 'pk' },
            { name: 'nombre' },
            { name: 'sucursal' },
          ],
          x: 370, y: 490,
        },
        {
          name: 'DIM_TIEMPO',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'mes' },
            { name: 'trimestre' },
            { name: 'anio' },
          ],
          x: 100, y: 230,
        },
      ],
      connections: [
        { from: 'FACT_VENTAS', to: 'DIM_CLIENTE' },
        { from: 'FACT_VENTAS', to: 'DIM_PRODUCTO' },
        { from: 'FACT_VENTAS', to: 'DIM_VENDEDOR' },
        { from: 'FACT_VENTAS', to: 'DIM_TIEMPO' },
      ],
    },
  },

  // ── Ejercicio 2: Recursos Humanos (Intermedio) ─────────────────────────────
  {
    id: 'olap_rrhh',
    title: 'Recursos Humanos',
    description:
      'El sistema de RR.HH. registra sueldos mensuales de empleados en distintos departamentos y cargos. Transformá el modelo OLAP en un DWH que permita analizar la masa salarial por dimensión organizacional y temporal.',
    difficulty: 'intermedio',
    hint: 'La tabla SUELDOS es tu tabla de hechos. Los montos bruto, descuentos y neto son las medidas. Creá DIM_TIEMPO desde el campo fecha.',
    olapTables: [
      {
        name: 'EMPLEADOS',
        columns: [
          { name: 'id_empleado', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'dni', type: 'CHAR(8)' },
          { name: 'fecha_nacimiento', type: 'DATE' },
        ],
      },
      {
        name: 'DEPARTAMENTOS',
        columns: [
          { name: 'id_departamento', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(80)' },
          { name: 'ubicacion', type: 'VARCHAR(80)' },
        ],
      },
      {
        name: 'CARGOS',
        columns: [
          { name: 'id_cargo', type: 'INT', isPK: true },
          { name: 'descripcion', type: 'VARCHAR(100)' },
          { name: 'nivel', type: 'VARCHAR(20)' },
        ],
      },
      {
        name: 'SUELDOS',
        columns: [
          { name: 'id_sueldo', type: 'INT', isPK: true },
          { name: 'id_empleado', type: 'INT', isFK: true },
          { name: 'id_departamento', type: 'INT', isFK: true },
          { name: 'id_cargo', type: 'INT', isFK: true },
          { name: 'fecha', type: 'DATE' },
          { name: 'monto_bruto', type: 'DECIMAL(12,2)' },
          { name: 'descuentos', type: 'DECIMAL(12,2)' },
          { name: 'monto_neto', type: 'DECIMAL(12,2)' },
        ],
      },
    ],
    expectedDwh: {
      title: 'Esquema DWH — RR.HH.',
      description: 'Modelo estrella centrado en sueldos y masa salarial',
      tables: [
        {
          name: 'FACT_SUELDOS',
          type: 'fact',
          columns: [
            { name: 'id_sueldo', role: 'pk' },
            { name: 'id_empleado', role: 'fk' },
            { name: 'id_departamento', role: 'fk' },
            { name: 'id_cargo', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'monto_bruto', role: 'measure' },
            { name: 'descuentos', role: 'measure' },
            { name: 'monto_neto', role: 'measure' },
          ],
          x: 370, y: 230,
        },
        {
          name: 'DIM_EMPLEADO',
          type: 'dimension',
          columns: [
            { name: 'id_empleado', role: 'pk' },
            { name: 'nombre' },
            { name: 'dni' },
            { name: 'fecha_nacimiento' },
          ],
          x: 370, y: -30,
        },
        {
          name: 'DIM_DEPARTAMENTO',
          type: 'dimension',
          columns: [
            { name: 'id_departamento', role: 'pk' },
            { name: 'nombre' },
            { name: 'ubicacion' },
          ],
          x: 640, y: 230,
        },
        {
          name: 'DIM_CARGO',
          type: 'dimension',
          columns: [
            { name: 'id_cargo', role: 'pk' },
            { name: 'descripcion' },
            { name: 'nivel' },
          ],
          x: 370, y: 490,
        },
        {
          name: 'DIM_TIEMPO',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'mes' },
            { name: 'trimestre' },
            { name: 'anio' },
          ],
          x: 100, y: 230,
        },
      ],
      connections: [
        { from: 'FACT_SUELDOS', to: 'DIM_EMPLEADO' },
        { from: 'FACT_SUELDOS', to: 'DIM_DEPARTAMENTO' },
        { from: 'FACT_SUELDOS', to: 'DIM_CARGO' },
        { from: 'FACT_SUELDOS', to: 'DIM_TIEMPO' },
      ],
    },
  },

  // ── Ejercicio 3: Logística / Inventario (Intermedio) ───────────────────────
  {
    id: 'olap_inventario',
    title: 'Logística e Inventario',
    description:
      'Un sistema de gestión de inventario registra entradas y salidas de artículos en depósitos con sus proveedores. Convertí el modelo OLAP en un DWH orientado al análisis de movimientos de stock.',
    difficulty: 'intermedio',
    hint: 'La tabla MOVIMIENTOS es la tabla de hechos. Las medidas son cantidad y el costo total. Las tablas de artículo, proveedor, depósito y tiempo son las dimensiones.',
    olapTables: [
      {
        name: 'ARTICULOS',
        columns: [
          { name: 'id_articulo', type: 'INT', isPK: true },
          { name: 'codigo', type: 'VARCHAR(20)' },
          { name: 'descripcion', type: 'VARCHAR(150)' },
          { name: 'unidad_medida', type: 'VARCHAR(20)' },
        ],
      },
      {
        name: 'PROVEEDORES',
        columns: [
          { name: 'id_proveedor', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'pais', type: 'VARCHAR(50)' },
        ],
      },
      {
        name: 'DEPOSITOS',
        columns: [
          { name: 'id_deposito', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(80)' },
          { name: 'ubicacion', type: 'VARCHAR(80)' },
          { name: 'capacidad', type: 'INT' },
        ],
      },
      {
        name: 'MOVIMIENTOS',
        columns: [
          { name: 'id_movimiento', type: 'INT', isPK: true },
          { name: 'id_articulo', type: 'INT', isFK: true },
          { name: 'id_proveedor', type: 'INT', isFK: true },
          { name: 'id_deposito', type: 'INT', isFK: true },
          { name: 'fecha', type: 'DATE' },
          { name: 'tipo', type: 'VARCHAR(10)' },
          { name: 'cantidad', type: 'INT' },
          { name: 'costo_total', type: 'DECIMAL(12,2)' },
        ],
      },
    ],
    expectedDwh: {
      title: 'Esquema DWH — Inventario',
      description: 'Modelo estrella centrado en movimientos de stock',
      tables: [
        {
          name: 'FACT_MOVIMIENTOS',
          type: 'fact',
          columns: [
            { name: 'id_movimiento', role: 'pk' },
            { name: 'id_articulo', role: 'fk' },
            { name: 'id_proveedor', role: 'fk' },
            { name: 'id_deposito', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'tipo' },
            { name: 'cantidad', role: 'measure' },
            { name: 'costo_total', role: 'measure' },
          ],
          x: 370, y: 230,
        },
        {
          name: 'DIM_ARTICULO',
          type: 'dimension',
          columns: [
            { name: 'id_articulo', role: 'pk' },
            { name: 'codigo' },
            { name: 'descripcion' },
            { name: 'unidad_medida' },
          ],
          x: 370, y: -30,
        },
        {
          name: 'DIM_PROVEEDOR',
          type: 'dimension',
          columns: [
            { name: 'id_proveedor', role: 'pk' },
            { name: 'nombre' },
            { name: 'pais' },
          ],
          x: 640, y: 230,
        },
        {
          name: 'DIM_DEPOSITO',
          type: 'dimension',
          columns: [
            { name: 'id_deposito', role: 'pk' },
            { name: 'nombre' },
            { name: 'ubicacion' },
            { name: 'capacidad' },
          ],
          x: 370, y: 490,
        },
        {
          name: 'DIM_TIEMPO',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'mes' },
            { name: 'trimestre' },
            { name: 'anio' },
          ],
          x: 100, y: 230,
        },
      ],
      connections: [
        { from: 'FACT_MOVIMIENTOS', to: 'DIM_ARTICULO' },
        { from: 'FACT_MOVIMIENTOS', to: 'DIM_PROVEEDOR' },
        { from: 'FACT_MOVIMIENTOS', to: 'DIM_DEPOSITO' },
        { from: 'FACT_MOVIMIENTOS', to: 'DIM_TIEMPO' },
      ],
    },
  },

  // ── Ejercicio 4: Sistema Hospitalario (Avanzado) ───────────────────────────
  {
    id: 'olap_hospital',
    title: 'Sistema Hospitalario',
    description:
      'El sistema médico registra consultas de pacientes con sus médicos, especialidades y diagnósticos. Diseñá un DWH estrella que permita analizar la actividad clínica: cantidad de consultas, honorarios y copagos por dimensión.',
    difficulty: 'avanzado',
    hint: 'CONSULTAS es tu tabla de hechos con 5 dimensiones (paciente, médico, especialidad, diagnóstico y tiempo). Las medidas son duracion_minutos, honorario y copago.',
    olapTables: [
      {
        name: 'PACIENTES',
        columns: [
          { name: 'id_paciente', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'fecha_nacimiento', type: 'DATE' },
          { name: 'obra_social', type: 'VARCHAR(60)' },
        ],
      },
      {
        name: 'MEDICOS',
        columns: [
          { name: 'id_medico', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'matricula', type: 'VARCHAR(20)' },
        ],
      },
      {
        name: 'ESPECIALIDADES',
        columns: [
          { name: 'id_especialidad', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(80)' },
        ],
      },
      {
        name: 'DIAGNOSTICOS',
        columns: [
          { name: 'id_diagnostico', type: 'INT', isPK: true },
          { name: 'codigo_cie', type: 'VARCHAR(10)' },
          { name: 'descripcion', type: 'VARCHAR(200)' },
        ],
      },
      {
        name: 'CONSULTAS',
        columns: [
          { name: 'id_consulta', type: 'INT', isPK: true },
          { name: 'id_paciente', type: 'INT', isFK: true },
          { name: 'id_medico', type: 'INT', isFK: true },
          { name: 'id_especialidad', type: 'INT', isFK: true },
          { name: 'id_diagnostico', type: 'INT', isFK: true },
          { name: 'fecha', type: 'DATE' },
          { name: 'duracion_minutos', type: 'INT' },
          { name: 'honorario', type: 'DECIMAL(10,2)' },
          { name: 'copago', type: 'DECIMAL(10,2)' },
        ],
      },
    ],
    expectedDwh: {
      title: 'Esquema DWH — Hospital',
      description: 'Modelo estrella de actividad clínica con 5 dimensiones',
      tables: [
        {
          name: 'FACT_CONSULTAS',
          type: 'fact',
          columns: [
            { name: 'id_consulta', role: 'pk' },
            { name: 'id_paciente', role: 'fk' },
            { name: 'id_medico', role: 'fk' },
            { name: 'id_especialidad', role: 'fk' },
            { name: 'id_diagnostico', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'duracion_minutos', role: 'measure' },
            { name: 'honorario', role: 'measure' },
            { name: 'copago', role: 'measure' },
          ],
          x: 370, y: 230,
        },
        {
          name: 'DIM_PACIENTE',
          type: 'dimension',
          columns: [
            { name: 'id_paciente', role: 'pk' },
            { name: 'nombre' },
            { name: 'fecha_nacimiento' },
            { name: 'obra_social' },
          ],
          x: 370, y: -60,
        },
        {
          name: 'DIM_MEDICO',
          type: 'dimension',
          columns: [
            { name: 'id_medico', role: 'pk' },
            { name: 'nombre' },
            { name: 'matricula' },
          ],
          x: 660, y: 50,
        },
        {
          name: 'DIM_ESPECIALIDAD',
          type: 'dimension',
          columns: [
            { name: 'id_especialidad', role: 'pk' },
            { name: 'nombre' },
          ],
          x: 660, y: 400,
        },
        {
          name: 'DIM_DIAGNOSTICO',
          type: 'dimension',
          columns: [
            { name: 'id_diagnostico', role: 'pk' },
            { name: 'codigo_cie' },
            { name: 'descripcion' },
          ],
          x: 370, y: 520,
        },
        {
          name: 'DIM_TIEMPO',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'mes' },
            { name: 'trimestre' },
            { name: 'anio' },
          ],
          x: 80, y: 230,
        },
      ],
      connections: [
        { from: 'FACT_CONSULTAS', to: 'DIM_PACIENTE' },
        { from: 'FACT_CONSULTAS', to: 'DIM_MEDICO' },
        { from: 'FACT_CONSULTAS', to: 'DIM_ESPECIALIDAD' },
        { from: 'FACT_CONSULTAS', to: 'DIM_DIAGNOSTICO' },
        { from: 'FACT_CONSULTAS', to: 'DIM_TIEMPO' },
      ],
    },
  },

  // ── Ejercicio 5: Plataforma Educativa (Avanzado) ──────────────────────────
  {
    id: 'olap_educacion',
    title: 'Plataforma Educativa',
    description:
      'Una plataforma de e-learning registra los exámenes rendidos por alumnos en distintos cursos con sus docentes. Construí un DWH estrella que permita analizar el rendimiento académico: puntajes, aprobación y evolución temporal.',
    difficulty: 'avanzado',
    hint: 'EXAMENES es la tabla de hechos. Las medidas son puntaje_obtenido y puntaje_maximo. El campo aprobado puede derivarse pero también se incluye como medida.',
    olapTables: [
      {
        name: 'ALUMNOS',
        columns: [
          { name: 'id_alumno', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'email', type: 'VARCHAR(100)' },
          { name: 'legajo', type: 'VARCHAR(20)' },
        ],
      },
      {
        name: 'CURSOS',
        columns: [
          { name: 'id_curso', type: 'INT', isPK: true },
          { name: 'titulo', type: 'VARCHAR(120)' },
          { name: 'modalidad', type: 'VARCHAR(20)' },
          { name: 'duracion_horas', type: 'INT' },
        ],
      },
      {
        name: 'DOCENTES',
        columns: [
          { name: 'id_docente', type: 'INT', isPK: true },
          { name: 'nombre', type: 'VARCHAR(100)' },
          { name: 'especialidad', type: 'VARCHAR(80)' },
        ],
      },
      {
        name: 'INSCRIPCIONES',
        columns: [
          { name: 'id_inscripcion', type: 'INT', isPK: true },
          { name: 'id_alumno', type: 'INT', isFK: true },
          { name: 'id_curso', type: 'INT', isFK: true },
          { name: 'id_docente', type: 'INT', isFK: true },
          { name: 'fecha_inicio', type: 'DATE' },
          { name: 'fecha_fin', type: 'DATE' },
          { name: 'estado', type: 'VARCHAR(20)' },
        ],
      },
      {
        name: 'EXAMENES',
        columns: [
          { name: 'id_examen', type: 'INT', isPK: true },
          { name: 'id_inscripcion', type: 'INT', isFK: true },
          { name: 'fecha', type: 'DATE' },
          { name: 'tipo', type: 'VARCHAR(30)' },
          { name: 'puntaje_obtenido', type: 'DECIMAL(5,2)' },
          { name: 'puntaje_maximo', type: 'DECIMAL(5,2)' },
          { name: 'aprobado', type: 'BOOLEAN' },
        ],
      },
    ],
    expectedDwh: {
      title: 'Esquema DWH — Plataforma Educativa',
      description: 'Modelo estrella centrado en rendimiento de exámenes',
      tables: [
        {
          name: 'FACT_EXAMENES',
          type: 'fact',
          columns: [
            { name: 'id_examen', role: 'pk' },
            { name: 'id_alumno', role: 'fk' },
            { name: 'id_curso', role: 'fk' },
            { name: 'id_docente', role: 'fk' },
            { name: 'id_tiempo', role: 'fk' },
            { name: 'puntaje_obtenido', role: 'measure' },
            { name: 'puntaje_maximo', role: 'measure' },
            { name: 'aprobado', role: 'measure' },
          ],
          x: 370, y: 230,
        },
        {
          name: 'DIM_ALUMNO',
          type: 'dimension',
          columns: [
            { name: 'id_alumno', role: 'pk' },
            { name: 'nombre' },
            { name: 'email' },
            { name: 'legajo' },
          ],
          x: 370, y: -30,
        },
        {
          name: 'DIM_CURSO',
          type: 'dimension',
          columns: [
            { name: 'id_curso', role: 'pk' },
            { name: 'titulo' },
            { name: 'modalidad' },
            { name: 'duracion_horas' },
          ],
          x: 640, y: 230,
        },
        {
          name: 'DIM_DOCENTE',
          type: 'dimension',
          columns: [
            { name: 'id_docente', role: 'pk' },
            { name: 'nombre' },
            { name: 'especialidad' },
          ],
          x: 370, y: 490,
        },
        {
          name: 'DIM_TIEMPO',
          type: 'dimension',
          columns: [
            { name: 'id_tiempo', role: 'pk' },
            { name: 'fecha' },
            { name: 'mes' },
            { name: 'trimestre' },
            { name: 'anio' },
          ],
          x: 100, y: 230,
        },
      ],
      connections: [
        { from: 'FACT_EXAMENES', to: 'DIM_ALUMNO' },
        { from: 'FACT_EXAMENES', to: 'DIM_CURSO' },
        { from: 'FACT_EXAMENES', to: 'DIM_DOCENTE' },
        { from: 'FACT_EXAMENES', to: 'DIM_TIEMPO' },
      ],
    },
  },
]
