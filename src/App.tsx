import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { SpreadsheetHeader } from './components/SpreadsheetHeader'
import { SpreadsheetGrid } from './components/SpreadsheetGrid'
import { AddColumnDialog } from './components/AddColumnDialog'
import { CSVImportDialog } from './components/CSVImportDialog'
import { Column, Row, Cell, ColumnType, EnrichmentType, SpreadsheetData } from './types/spreadsheet'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetData | null>(null)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [showImportCSV, setShowImportCSV] = useState(false)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load or create spreadsheet
  useEffect(() => {
    if (!user) return

    const loadSpreadsheet = () => {
      try {
        // Try to load from localStorage
        const saved = localStorage.getItem(`spreadsheet_${user.id}`)
        
        if (saved) {
          const data = JSON.parse(saved)
          setSpreadsheet(data)
        } else {
          // Create new spreadsheet with sample data
          const newSpreadsheet: SpreadsheetData = {
            id: `sheet_${Date.now()}`,
            name: 'My Spreadsheet',
            columns: [
              {
                id: 'col_name',
                name: 'Name',
                type: 'text',
                width: 200,
                isVisible: true
              },
              {
                id: 'col_email',
                name: 'Email',
                type: 'text',
                width: 250,
                isVisible: true
              },
              {
                id: 'col_company',
                name: 'Company',
                type: 'text',
                width: 200,
                isVisible: true
              }
            ],
            rows: [
              {
                id: 'row_1',
                cells: {
                  col_name: {
                    id: 'cell_1_name',
                    rowId: 'row_1',
                    columnId: 'col_name',
                    value: 'John Doe'
                  },
                  col_email: {
                    id: 'cell_1_email',
                    rowId: 'row_1',
                    columnId: 'col_email',
                    value: 'john@example.com'
                  },
                  col_company: {
                    id: 'cell_1_company',
                    rowId: 'row_1',
                    columnId: 'col_company',
                    value: 'Acme Corp'
                  }
                }
              },
              {
                id: 'row_2',
                cells: {
                  col_name: {
                    id: 'cell_2_name',
                    rowId: 'row_2',
                    columnId: 'col_name',
                    value: 'Jane Smith'
                  },
                  col_email: {
                    id: 'cell_2_email',
                    rowId: 'row_2',
                    columnId: 'col_email',
                    value: 'jane@company.com'
                  },
                  col_company: {
                    id: 'cell_2_company',
                    rowId: 'row_2',
                    columnId: 'col_company',
                    value: 'Tech Solutions'
                  }
                }
              }
            ],
            userId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          saveSpreadsheet(newSpreadsheet)
          setSpreadsheet(newSpreadsheet)
        }
      } catch (error) {
        console.error('Failed to load spreadsheet:', error)
        toast.error('Failed to load spreadsheet')
      }
    }

    loadSpreadsheet()
  }, [user])

  const saveSpreadsheet = (data: SpreadsheetData) => {
    try {
      localStorage.setItem(`spreadsheet_${data.userId}`, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save spreadsheet:', error)
      toast.error('Failed to save changes')
    }
  }

  const handleTitleChange = useCallback((title: string) => {
    if (!spreadsheet) return
    const updated = { ...spreadsheet, name: title, updatedAt: new Date().toISOString() }
    setSpreadsheet(updated)
    saveSpreadsheet(updated)
  }, [spreadsheet])

  const handleAddColumn = useCallback((name: string, type: ColumnType, enrichmentType?: EnrichmentType, customPrompt?: string) => {
    if (!spreadsheet) return

    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name,
      type,
      enrichmentType,
      customPrompt,
      width: 200,
      isVisible: true
    }

    // Add empty cells for existing rows
    const updatedRows = spreadsheet.rows.map(row => ({
      ...row,
      cells: {
        ...row.cells,
        [newColumn.id]: {
          id: `cell_${row.id}_${newColumn.id}`,
          rowId: row.id,
          columnId: newColumn.id,
          value: ''
        }
      }
    }))

    const updated = {
      ...spreadsheet,
      columns: [...spreadsheet.columns, newColumn],
      rows: updatedRows,
      updatedAt: new Date().toISOString()
    }
    
    setSpreadsheet(updated)
    saveSpreadsheet(updated)
    toast.success(`Column "${name}" added`)
  }, [spreadsheet])

  const handleImportCSV = useCallback((data: any[], headers: string[]) => {
    if (!spreadsheet) return

    // Create columns from headers
    const newColumns: Column[] = headers.map((header, index) => ({
      id: `col_${Date.now()}_${index}`,
      name: header,
      type: 'text' as ColumnType,
      width: 200,
      isVisible: true
    }))

    // Create rows from data
    const newRows: Row[] = data.map((rowData, rowIndex) => {
      const cells: Record<string, Cell> = {}
      
      newColumns.forEach((column, colIndex) => {
        cells[column.id] = {
          id: `cell_${Date.now()}_${rowIndex}_${colIndex}`,
          rowId: `row_${Date.now()}_${rowIndex}`,
          columnId: column.id,
          value: rowData[headers[colIndex]] || ''
        }
      })

      return {
        id: `row_${Date.now()}_${rowIndex}`,
        cells
      }
    })

    const updated = {
      ...spreadsheet,
      columns: newColumns,
      rows: newRows,
      updatedAt: new Date().toISOString()
    }
    
    setSpreadsheet(updated)
    saveSpreadsheet(updated)
    toast.success(`Imported ${data.length} rows`)
  }, [spreadsheet])

  const handleCellChange = useCallback((rowId: string, columnId: string, value: any) => {
    if (!spreadsheet) return

    const updatedRows = spreadsheet.rows.map(row => {
      if (row.id === rowId) {
        const existingCell = row.cells[columnId]
        return {
          ...row,
          cells: {
            ...row.cells,
            [columnId]: {
              id: existingCell?.id || `cell_${rowId}_${columnId}`,
              rowId,
              columnId,
              value
            }
          }
        }
      }
      return row
    })

    const updated = { 
      ...spreadsheet, 
      rows: updatedRows,
      updatedAt: new Date().toISOString()
    }
    setSpreadsheet(updated)
    saveSpreadsheet(updated)
  }, [spreadsheet])

  const handleColumnResize = useCallback((columnId: string, width: number) => {
    if (!spreadsheet) return

    const updatedColumns = spreadsheet.columns.map(col => 
      col.id === columnId ? { ...col, width } : col
    )

    const updated = { 
      ...spreadsheet, 
      columns: updatedColumns,
      updatedAt: new Date().toISOString()
    }
    setSpreadsheet(updated)
    saveSpreadsheet(updated)
  }, [spreadsheet])

  const handleColumnDelete = useCallback((columnId: string) => {
    if (!spreadsheet) return

    const updatedColumns = spreadsheet.columns.filter(col => col.id !== columnId)
    const updatedRows = spreadsheet.rows.map(row => ({
      ...row,
      cells: Object.fromEntries(
        Object.entries(row.cells).filter(([cellColumnId]) => cellColumnId !== columnId)
      )
    }))

    const updated = {
      ...spreadsheet,
      columns: updatedColumns,
      rows: updatedRows,
      updatedAt: new Date().toISOString()
    }
    
    setSpreadsheet(updated)
    saveSpreadsheet(updated)
    toast.success('Column deleted')
  }, [spreadsheet])

  const handleEnrichColumn = useCallback(async (columnId: string) => {
    if (!spreadsheet) return

    const column = spreadsheet.columns.find(col => col.id === columnId)
    if (!column || column.type !== 'enrichment') return

    toast.success('Enrichment started (demo - not implemented yet)')
  }, [spreadsheet])

  const handleExport = useCallback(() => {
    if (!spreadsheet) return
    
    // Create CSV content
    const headers = spreadsheet.columns.map(col => col.name)
    const csvRows = [
      headers.join(','),
      ...spreadsheet.rows.map(row => 
        spreadsheet.columns.map(col => {
          const cell = row.cells[col.id]
          const value = cell?.value || ''
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ]
    
    const csvContent = csvRows.join('\\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${spreadsheet.name}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Spreadsheet exported!')
  }, [spreadsheet])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Clay Clone</h1>
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <button 
            onClick={() => blink.auth.login()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!spreadsheet) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading spreadsheet...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <SpreadsheetHeader
        title={spreadsheet.name}
        onTitleChange={handleTitleChange}
        onImportCSV={() => setShowImportCSV(true)}
        onExport={handleExport}
        onAddColumn={() => setShowAddColumn(true)}
      />
      
      <SpreadsheetGrid
        columns={spreadsheet.columns}
        rows={spreadsheet.rows}
        onCellChange={handleCellChange}
        onColumnResize={handleColumnResize}
        onColumnDelete={handleColumnDelete}
        onEnrichColumn={handleEnrichColumn}
        className="flex-1"
      />

      <AddColumnDialog
        open={showAddColumn}
        onOpenChange={setShowAddColumn}
        onAddColumn={handleAddColumn}
      />

      <CSVImportDialog
        open={showImportCSV}
        onOpenChange={setShowImportCSV}
        onImport={handleImportCSV}
      />
    </div>
  )
}

export default App