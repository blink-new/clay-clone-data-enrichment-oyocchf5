export type ColumnType = 'text' | 'number' | 'checkbox' | 'enrichment'

export type EnrichmentType = 'email' | 'phone' | 'company' | 'custom'

export interface Column {
  id: string
  name: string
  type: ColumnType
  enrichmentType?: EnrichmentType
  customPrompt?: string
  width: number
  isVisible: boolean
}

export interface Cell {
  id: string
  rowId: string
  columnId: string
  value: any
  isEnriching?: boolean
  enrichmentError?: string
}

export interface Row {
  id: string
  cells: Record<string, Cell>
  isSelected?: boolean
}

export interface SpreadsheetData {
  id: string
  name: string
  columns: Column[]
  rows: Row[]
  userId: string
  createdAt: string
  updatedAt: string
}