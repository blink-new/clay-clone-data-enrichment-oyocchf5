import { useState } from 'react'
import { Type, Hash, CheckSquare, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { ColumnType, EnrichmentType } from '../types/spreadsheet'

interface AddColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddColumn: (name: string, type: ColumnType, enrichmentType?: EnrichmentType, customPrompt?: string) => void
}

const COLUMN_TYPES = [
  { value: 'text' as ColumnType, label: 'Text', icon: Type, description: 'Simple text values' },
  { value: 'number' as ColumnType, label: 'Number', icon: Hash, description: 'Numeric values' },
  { value: 'checkbox' as ColumnType, label: 'Checkbox', icon: CheckSquare, description: 'True/false values' },
  { value: 'enrichment' as ColumnType, label: 'Enrichment', icon: Sparkles, description: 'AI-powered data enrichment' }
]

const ENRICHMENT_TYPES = [
  { value: 'email' as EnrichmentType, label: 'Email Address', description: 'Find email addresses' },
  { value: 'phone' as EnrichmentType, label: 'Phone Number', description: 'Find phone numbers' },
  { value: 'company' as EnrichmentType, label: 'Company Info', description: 'Get company details' },
  { value: 'custom' as EnrichmentType, label: 'Custom Prompt', description: 'Use custom AI prompt' }
]

export function AddColumnDialog({ open, onOpenChange, onAddColumn }: AddColumnDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ColumnType>('text')
  const [enrichmentType, setEnrichmentType] = useState<EnrichmentType>('email')
  const [customPrompt, setCustomPrompt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAddColumn(
      name.trim(),
      type,
      type === 'enrichment' ? enrichmentType : undefined,
      type === 'enrichment' && enrichmentType === 'custom' ? customPrompt : undefined
    )

    // Reset form
    setName('')
    setType('text')
    setEnrichmentType('email')
    setCustomPrompt('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Column Name</Label>
            <Input
              id="column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter column name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Column Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {COLUMN_TYPES.map((columnType) => {
                const Icon = columnType.icon
                return (
                  <button
                    key={columnType.value}
                    type="button"
                    onClick={() => setType(columnType.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      type === columnType.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{columnType.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{columnType.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {type === 'enrichment' && (
            <>
              <div className="space-y-2">
                <Label>Enrichment Type</Label>
                <Select value={enrichmentType} onValueChange={(value: EnrichmentType) => setEnrichmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENRICHMENT_TYPES.map((enrichType) => (
                      <SelectItem key={enrichType.value} value={enrichType.value}>
                        <div>
                          <div className="font-medium">{enrichType.label}</div>
                          <div className="text-xs text-muted-foreground">{enrichType.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {enrichmentType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-prompt">Custom Prompt</Label>
                  <Textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your custom AI prompt. Use {column_name} to reference other columns."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: "Based on the company name in {company}, find the CEO's email address"
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Add Column
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}