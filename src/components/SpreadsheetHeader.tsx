import { Upload, Download, Plus, FileText } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface SpreadsheetHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  onImportCSV: () => void
  onExport: () => void
  onAddColumn: () => void
}

export function SpreadsheetHeader({
  title,
  onTitleChange,
  onImportCSV,
  onExport,
  onAddColumn
}: SpreadsheetHeaderProps) {
  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="border-none bg-transparent text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Untitled Spreadsheet"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onImportCSV}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={onAddColumn}>
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
        </div>
      </div>
    </div>
  )
}