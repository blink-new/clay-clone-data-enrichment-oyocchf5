import { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Type, Hash, CheckSquare, Sparkles, Trash2, Settings } from 'lucide-react'
import { Column } from '../types/spreadsheet'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

interface ColumnHeaderProps {
  column: Column
  onResize: (width: number) => void
  onDelete: () => void
  onEnrich: () => void
}

const COLUMN_TYPE_ICONS = {
  text: Type,
  number: Hash,
  checkbox: CheckSquare,
  enrichment: Sparkles
}

const COLUMN_TYPE_COLORS = {
  text: 'bg-blue-100 text-blue-700',
  number: 'bg-green-100 text-green-700',
  checkbox: 'bg-purple-100 text-purple-700',
  enrichment: 'bg-orange-100 text-orange-700'
}

export function ColumnHeader({ column, onResize, onDelete, onEnrich }: ColumnHeaderProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const resizeRef = useRef<HTMLDivElement>(null)

  const Icon = COLUMN_TYPE_ICONS[column.type]

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(column.width)
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientX - startX
      const newWidth = Math.max(120, startWidth + diff)
      onResize(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, startX, startWidth, onResize])

  return (
    <div className="relative flex h-full items-center justify-between px-3 py-2 bg-gray-50">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-sm truncate">{column.name}</span>
        <Badge variant="secondary" className={cn("text-xs", COLUMN_TYPE_COLORS[column.type])}>
          {column.type}
        </Badge>
        {column.type === 'enrichment' && column.enrichmentType && (
          <Badge variant="outline" className="text-xs">
            {column.enrichmentType}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        {column.type === 'enrichment' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnrich}
            className="h-6 w-6 p-0"
            title="Run enrichment"
          >
            <Sparkles className="h-3 w-3" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className={cn(
          "absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20 transition-colors",
          isResizing && "bg-primary/30"
        )}
        onMouseDown={handleMouseDown}
        title="Drag to resize column"
      />
    </div>
  )
}