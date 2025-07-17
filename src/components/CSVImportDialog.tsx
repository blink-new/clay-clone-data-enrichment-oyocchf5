import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import Papa from 'papaparse'

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any[], headers: string[]) => void
}

interface ParsedData {
  headers: string[]
  rows: any[][]
  data: any[]
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing'>('upload')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError(null)
    setProgress(0)
    
    // Parse the entire file
    Papa.parse(selectedFile, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Failed to parse CSV: ${results.errors[0].message}`)
          return
        }

        if (results.data.length === 0) {
          setError('CSV file is empty')
          return
        }

        const headers = results.data[0] as string[]
        const rows = results.data.slice(1) as any[][]
        
        // Convert to object format
        const data = rows.map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })

        setParsedData({ headers, rows, data })
        
        // Initialize column mapping
        const mapping: Record<string, string> = {}
        headers.forEach(header => {
          mapping[header] = header
        })
        setColumnMapping(mapping)
        
        setStep('mapping')
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`)
      }
    })
  }, [])

  const handleImport = useCallback(() => {
    if (!parsedData) return

    setStep('importing')
    setIsProcessing(true)
    setProgress(0)
    setError(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 100)

    // Process the data with column mapping
    setTimeout(() => {
      try {
        const mappedHeaders = Object.values(columnMapping).filter(Boolean)
        const mappedData = parsedData.data.map(row => {
          const mappedRow: any = {}
          Object.entries(columnMapping).forEach(([originalHeader, mappedHeader]) => {
            if (mappedHeader) {
              mappedRow[mappedHeader] = row[originalHeader] || ''
            }
          })
          return mappedRow
        })

        setProgress(100)
        onImport(mappedData, mappedHeaders)
        
        // Reset state
        resetDialog()
        onOpenChange(false)
      } catch (error) {
        setError(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsProcessing(false)
      }
    }, 1000)
  }, [parsedData, columnMapping, onImport, onOpenChange])

  const resetDialog = () => {
    setFile(null)
    setParsedData(null)
    setStep('upload')
    setColumnMapping({})
    setIsProcessing(false)
    setProgress(0)
    setError(null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] }
      } as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }, [handleFileSelect])

  const handleClose = () => {
    if (!isProcessing) {
      resetDialog()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: File Upload */}
          {step === 'upload' && (
            <>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <Label htmlFor="csv-file" className="cursor-pointer">
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                  <Button variant="outline" className="mt-4" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
            </>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{file?.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({parsedData.data.length} rows, {parsedData.headers.length} columns)
                </span>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Column Mapping</Label>
                <p className="text-sm text-muted-foreground">
                  Map your CSV columns to the desired column names. Leave blank to skip a column.
                </p>
                
                <div className="grid gap-3">
                  {parsedData.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{header}</Label>
                        <div className="text-xs text-muted-foreground mt-1">
                          Sample: {parsedData.rows[0]?.[index] || 'No data'}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Select
                          value={columnMapping[header] || ''}
                          onValueChange={(value) => 
                            setColumnMapping(prev => ({ ...prev, [header]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column name" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Skip this column</SelectItem>
                            <SelectItem value={header}>{header} (keep original)</SelectItem>
                            <SelectItem value="Name">Name</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Phone">Phone</SelectItem>
                            <SelectItem value="Company">Company</SelectItem>
                            <SelectItem value="Title">Title</SelectItem>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Notes">Notes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview (first 3 rows)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-2 border-b">
                    <div className="grid gap-2" style={{ 
                      gridTemplateColumns: `repeat(${Object.values(columnMapping).filter(Boolean).length}, minmax(100px, 1fr))` 
                    }}>
                      {Object.values(columnMapping).filter(Boolean).map((mappedHeader, index) => (
                        <div key={index} className="font-medium text-sm truncate">{mappedHeader}</div>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {parsedData.rows.slice(0, 3).map((row, rowIndex) => (
                      <div key={rowIndex} className="p-2 border-b last:border-b-0">
                        <div className="grid gap-2" style={{ 
                          gridTemplateColumns: `repeat(${Object.values(columnMapping).filter(Boolean).length}, minmax(100px, 1fr))` 
                        }}>
                          {Object.entries(columnMapping).map(([originalHeader, mappedHeader], index) => 
                            mappedHeader ? (
                              <div key={index} className="text-sm truncate">
                                {row[parsedData.headers.indexOf(originalHeader)] || ''}
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium mb-2">Importing CSV data...</p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            {step === 'mapping' && (
              <Button onClick={handleImport} disabled={Object.values(columnMapping).filter(Boolean).length === 0}>
                Import Data
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}