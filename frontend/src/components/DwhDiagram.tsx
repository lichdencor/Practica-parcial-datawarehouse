import type { DwhDiagramConfig, DwhTable } from '../data/questions'

const TABLE_WIDTH = 160
const ROW_HEIGHT = 22
const HEADER_HEIGHT = 30
const PAD = 8

function tableHeight(t: DwhTable) {
  return HEADER_HEIGHT + t.columns.length * ROW_HEIGHT + PAD
}

function tableCenter(t: DwhTable): [number, number] {
  return [t.x + TABLE_WIDTH / 2, t.y + tableHeight(t) / 2]
}

function roleColor(role?: string) {
  if (role === 'pk') return '#f59e0b'
  if (role === 'fk') return '#6366f1'
  if (role === 'measure') return '#10b981'
  return '#9ca3af'
}

function TableBox({ table }: { table: DwhTable }) {
  const h = tableHeight(table)
  const headerColor =
    table.type === 'fact' ? '#1a365d' :
    table.type === 'dimension' ? '#2b6cb0' : '#5a7fa8'
  const headerText = '#ffffff'

  return (
    <g transform={`translate(${table.x}, ${table.y})`}>
      {/* Shadow */}
      <rect x={3} y={3} width={TABLE_WIDTH} height={h} rx={6} fill="rgba(0,0,0,0.08)" />
      {/* Body */}
      <rect width={TABLE_WIDTH} height={h} rx={6} fill="white" stroke={headerColor} strokeWidth={1.5} />
      {/* Header */}
      <rect width={TABLE_WIDTH} height={HEADER_HEIGHT} rx={6} fill={headerColor} />
      <rect y={HEADER_HEIGHT - 6} width={TABLE_WIDTH} height={6} fill={headerColor} />
      <text
        x={TABLE_WIDTH / 2}
        y={HEADER_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={headerText}
        fontSize={10}
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {table.name}
      </text>
      {table.type === 'fact' && (
        <text x={TABLE_WIDTH / 2} y={HEADER_HEIGHT - 5} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={7} fontFamily="Inter">
          FACT TABLE
        </text>
      )}

      {/* Columns */}
      {table.columns.map((col, i) => (
        <g key={col.name} transform={`translate(0, ${HEADER_HEIGHT + PAD / 2 + i * ROW_HEIGHT})`}>
          {i % 2 === 0 && (
            <rect x={2} width={TABLE_WIDTH - 4} height={ROW_HEIGHT} fill="#f8fafc" rx={2} />
          )}
          <circle cx={14} cy={ROW_HEIGHT / 2} r={4} fill={roleColor(col.role)} />
          <text
            x={24}
            y={ROW_HEIGHT / 2}
            dominantBaseline="middle"
            fontSize={9.5}
            fontFamily="'JetBrains Mono', Consolas, monospace"
            fill={col.role === 'pk' ? '#92400e' : col.role === 'fk' ? '#3730a3' : col.role === 'measure' ? '#065f46' : '#374151'}
            fontWeight={col.role === 'pk' ? '700' : col.role === 'measure' ? '600' : '400'}
          >
            {col.name}
          </text>
          {col.role && (
            <text
              x={TABLE_WIDTH - 6}
              y={ROW_HEIGHT / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={7.5}
              fontFamily="Inter"
              fill={roleColor(col.role)}
              fontWeight="600"
            >
              {col.role?.toUpperCase()}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}

function Connection({
  from,
  to,
  tables,
}: {
  from: string
  to: string
  tables: DwhTable[]
}) {
  const fromTable = tables.find(t => t.name === from)
  const toTable = tables.find(t => t.name === to)
  if (!fromTable || !toTable) return null

  const [x1, y1] = tableCenter(fromTable)
  const [x2, y2] = tableCenter(toTable)

  // Midpoint curve
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  return (
    <line
      x1={x1} y1={y1}
      x2={x2} y2={y2}
      stroke="#94a3b8"
      strokeWidth={1.5}
      strokeDasharray="5,3"
      markerEnd="url(#arrow)"
    />
  )
}

interface Props {
  diagram: DwhDiagramConfig
}

export default function DwhDiagram({ diagram }: Props) {
  // Compute SVG viewBox
  const allX = diagram.tables.map(t => t.x)
  const allY = diagram.tables.map(t => t.y)
  const allRight = diagram.tables.map(t => t.x + TABLE_WIDTH)
  const allBottom = diagram.tables.map(t => t.y + tableHeight(t))

  const minX = Math.min(...allX) - 20
  const minY = Math.min(...allY) - 20
  const maxX = Math.max(...allRight) + 20
  const maxY = Math.max(...allBottom) + 20

  const vbWidth = maxX - minX
  const vbHeight = maxY - minY

  return (
    <div className="w-full">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
        <h3 className="font-semibold text-ub-dark text-sm mb-1">{diagram.title}</h3>
        <p className="text-xs text-gray-500">{diagram.description}</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-4 rounded bg-ub-dark" />
          <span className="text-gray-600">Tabla de Hechos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-4 rounded bg-ub-mid" />
          <span className="text-gray-600">Dimensión</span>
        </div>
        <div className="flex items-center gap-1.5">
          <circle className="inline-block" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
          <span className="text-gray-600 ml-1">PK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#6366f1' }} />
          <span className="text-gray-600 ml-1">FK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span className="text-gray-600 ml-1">Medida</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <svg
          viewBox={`${minX} ${minY} ${vbWidth} ${vbHeight}`}
          style={{ width: '100%', minWidth: Math.min(vbWidth, 900), height: 'auto', display: 'block' }}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Draw connections first (below tables) */}
          {diagram.connections.map((conn, i) => (
            <Connection key={i} from={conn.from} to={conn.to} tables={diagram.tables} />
          ))}

          {/* Draw tables */}
          {diagram.tables.map(table => (
            <TableBox key={table.name} table={table} />
          ))}
        </svg>
      </div>
    </div>
  )
}
