import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Column, Cell } from '../types/spreadsheet'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { cn } from '../lib/utils'

interface SpreadsheetCellProps {
  cell: Cell
  column: Column
  onChange: (value: any) => void
  isSelected: boolean
}

export function SpreadsheetCell({ cell, column, onChange, isSelected }: SpreadsheetCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(cell?.value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(cell?.value || '')
  }, [cell?.value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    if (column.type !== 'checkbox' && !cell?.isEnriching) {
      setIsEditing(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(cell?.value || '')
      setIsEditing(false)
    }
  }

  const handleSave = () => {
    let processedValue = editValue
    
    if (column.type === 'number') {
      const numValue = parseFloat(editValue)
      processedValue = isNaN(numValue) ? 0 : numValue
    }
    
    onChange(processedValue)
    setIsEditing(false)
  }

  const handleBlur = () => {
    handleSave()
  }

  const renderCellContent = () => {
    if (cell?.isEnriching) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Enriching...</span>
        </div>
      )
    }

    if (cell?.enrichmentError) {
      return (
        <div className="text-xs text-destructive" title={cell.enrichmentError}>
          Error
        </div>
      )
    }

    switch (column.type) {
      case 'checkbox':
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={!!cell?.value}
              onCheckedChange={(checked) => onChange(checked)}
            />
          </div>
        )
      
      case 'number':
        if (isEditing) {
          return (
            <Input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-right"
            />
          )
        }
        return (
          <span className="text-right w-full block">
            {cell?.value !== undefined && cell?.value !== '' ? cell.value : ''}
          </span>
        )
      
      default:
        if (isEditing) {
          return (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="border-none bg-transparent p-0 h-auto focus-visible:ring-0"
            />
          )
        }
        return (
          <span className="truncate w-full block">
            {cell?.value || ''}
          </span>
        )
    }
  }

  return (
    <div
      className={cn(
        "h-full w-full px-3 py-2 flex items-center cursor-cell",
        isSelected && "bg-primary/5",
        column.type === 'checkbox' && "justify-center",
        column.type === 'number' && "justify-end"
      )}
      onDoubleClick={handleDoubleClick}
    >
      {renderCellContent()}
    </div>
  )
}