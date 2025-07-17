import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Column, Row, Cell } from '../types/spreadsheet'
import { SpreadsheetCell } from './SpreadsheetCell'
import { ColumnHeader } from './ColumnHeader'
import { cn } from '../lib/utils'

interface SpreadsheetGridProps {
  columns: Column[]
  rows: Row[]
  onCellChange: (rowId: string, columnId: string, value: any) => void
  onColumnResize: (columnId: string, width: number) => void
  onColumnDelete: (columnId: string) => void
  onEnrichColumn: (columnId: string) => void
  className?: string
}

const HEADER_HEIGHT = 48
const ROW_HEIGHT = 40
const MIN_COLUMN_WIDTH = 120

export function SpreadsheetGrid({
  columns,
  rows,
  onCellChange,
  onColumnResize,
  onColumnDelete,
  onEnrichColumn,
  className
}: SpreadsheetGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; columnIndex: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const visibleColumns = useMemo(() => columns.filter(col => col.isVisible), [columns])
  const totalWidth = useMemo(() => visibleColumns.reduce((sum, col) => sum + col.width, 0), [visibleColumns])

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleCellClick = useCallback((rowIndex: number, columnIndex: number) => {
    setSelectedCell({ rowIndex, columnIndex })
  }, [])

  if (visibleColumns.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No columns available</p>
          <p className="text-sm">Add a column to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("flex-1 overflow-auto border", className)}>
      <div className="min-w-full" style={{ width: Math.max(totalWidth, containerSize.width) }}>
        {/* Header Row */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b" style={{ height: HEADER_HEIGHT }}>
          <div className="flex">
            {visibleColumns.map((column, columnIndex) => (
              <div
                key={column.id}
                className="border-r border-gray-200 relative"
                style={{ width: column.width, minWidth: MIN_COLUMN_WIDTH }}
              >
                <ColumnHeader
                  column={column}
                  onResize={(width) => onColumnResize(column.id, width)}
                  onDelete={() => onColumnDelete(column.id)}
                  onEnrich={() => onEnrichColumn(column.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <div className="bg-white">
          {rows.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No data available</p>
                <p className="text-sm">Import a CSV file or add data manually</p>
              </div>
            </div>
          ) : (
            rows.map((row, rowIndex) => (
              <div key={row.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                {visibleColumns.map((column, columnIndex) => {
                  const cell = row.cells[column.id] || {
                    id: `cell_${row.id}_${column.id}`,
                    rowId: row.id,
                    columnId: column.id,
                    value: ''
                  }
                  const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.columnIndex === columnIndex

                  return (
                    <div
                      key={column.id}
                      className={cn(
                        "border-r border-gray-200 relative",
                        isSelected && "ring-2 ring-primary ring-inset"
                      )}
                      style={{ width: column.width, minWidth: MIN_COLUMN_WIDTH, height: ROW_HEIGHT }}
                      onClick={() => handleCellClick(rowIndex, columnIndex)}
                    >
                      <SpreadsheetCell
                        cell={cell}
                        column={column}
                        onChange={(value) => onCellChange(row.id, column.id, value)}
                        isSelected={isSelected}
                      />
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}