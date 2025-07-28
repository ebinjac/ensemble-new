// app/tools/teams/[teamId]/tohub/components/DynamicEntrySection.tsx
'use client';

import { useState, useEffect, useTransition, useOptimistic } from 'react';
import {
  addEntry,
  updateEntry,
  deleteEntry,
  flagEntry,
  clearFlag,
  fetchSectionEntries,
} from '@/app/actions/tohub/tohub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/tohub/tohub-richtext-editor';
import { EnhancedEntryTable } from '@/components/tohub/tohub-entry-table';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { SectionConfig } from '@/components/tohub/config/sessionConfig';


interface Props {
  sessionId: string;
  config: SectionConfig;
  subApplications?: any[];
}

export default function DynamicEntrySection({ sessionId, config, subApplications = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const [optimisticRows, addOptimisticRow] = useOptimistic(
    rows,
    (state, action: any) => {
      switch (action.type) {
        case 'add':
          return [...state, { ...action.data, id: `temp-${Date.now()}` }];
        case 'delete':
          return state.filter(row => row.id !== action.id);
        case 'flag':
          return state.map(row =>
            row.id === action.id ? { ...row, isFlagged: true } : row
          );
        case 'unflag':
          return state.map(row =>
            row.id === action.id ? { ...row, isFlagged: false } : row
          );
        default:
          return state;
      }
    }
  );

  // Initialize form with default values based on config
  const getInitialFormState = () => {
    const initialState: Record<string, any> = {};

    // Initialize columns
    config.columns.forEach(col => {
      initialState[col.key] = '';
    });

    // Initialize custom fields
    config.customFields?.forEach(field => {
      if (field.type === 'select' && field.options) {
        initialState[field.key] = field.options[0]?.value || '';
      } else {
        initialState[field.key] = '';
      }
    });

    // Standard fields
    if (config.hasSubAppSelection) {
      initialState.selectedSubApps = [] as string[];
    }
    if (config.hasStatusDropdown) {
      initialState.status = config.statusOptions?.[0]?.value || '';
    }
    if (config.hasImportantFlag) {
      initialState.isImportant = false;
    }
    if (config.hasRichTextComments) {
      initialState.comments = '';
      initialState.description = '';
    }

    return initialState;
  };

  const [form, setForm] = useState<Record<string, any>>(getInitialFormState());

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const entries = await fetchSectionEntries(sessionId, config.section);
        setRows(entries);
      } catch (error) {
        console.error(`Failed to load ${config.title} entries:`, error);
        toast.error(`Failed to load ${config.title} entries`);
      }
    };
    loadData();
  }, [sessionId, config.section, config.title]);

  // Handle sub-application selection
  const handleSubAppToggle = (subAppId: string) => {
    if (!config.hasSubAppSelection) return;

    const current = form.selectedSubApps || [];
    const updated = current.includes(subAppId)
      ? current.filter((id: string) => id !== subAppId)
      : [...current, subAppId];

    setForm({ ...form, selectedSubApps: updated });
  };

  // Handle editing
  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    const editForm = { ...getInitialFormState() };

    // Populate form with entry data
    Object.keys(editForm).forEach(key => {
      if (entry.sectionData?.[key] !== undefined) {
        editForm[key] = entry.sectionData[key];
      } else if (entry[key] !== undefined) {
        editForm[key] = entry[key];
      }
    });

    setForm(editForm);
    setOpen(true);
  };

  // Validate form
  const validateForm = () => {
    // Check required columns
    for (const col of config.columns) {
      if (col.required && !form[col.key]?.trim()) {
        toast.error(`${col.label} is required`);
        return false;
      }
    }

    // Check required custom fields
    if (config.customFields) {
      for (const field of config.customFields) {
        if (field.required && field.conditional && !field.conditional(form)) {
          continue; // Skip validation if field is conditionally hidden
        }
        if (field.required && !form[field.key]?.trim()) {
          toast.error(`${field.label} is required`);
          return false;
        }
      }
    }

    // Check status requirement
    if (config.hasStatusDropdown && !form.status) {
      toast.error('Status is required');
      return false;
    }

    // Custom validation
    if (config.customValidation) {
      const error = config.customValidation(form);
      if (error) {
        toast.error(error);
        return false;
      }
    }

    return true;
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const title = config.titleGenerator
      ? config.titleGenerator(form)
      : form[config.columns[0]?.key] || form.title || 'Untitled Entry';

    const baseEntry = {
      section: config.section,
      title,
      description: form.description || '',
      comments: form.comments || '',
      status: form.status,
      isImportant: form.isImportant || form.priority === 'high',
      sectionData: form,
    };

    if (editingEntry) {
      // Update existing entry
      startTransition(async () => {
        try {
          await updateEntry(editingEntry.id, baseEntry);

          setRows(prev => prev.map(row =>
            row.id === editingEntry.id ? { ...row, ...baseEntry, updatedAt: new Date().toISOString() } : row
          ));

          setOpen(false);
          setEditingEntry(null);
          setForm(getInitialFormState());
          toast.success(`${config.title} entry updated successfully`);
        } catch (error) {
          console.error('Failed to update entry:', error);
          toast.error('Failed to update entry');
        }
      });
    } else {
      // Create new entry
      startTransition(async () => {
        // Add optimistic update within the transition
        addOptimisticRow({ type: 'add', data: baseEntry });

        try {
          const savedEntry = await addEntry(sessionId, baseEntry);
          setRows(prev => [...prev, savedEntry]);
          setOpen(false);
          setForm(getInitialFormState());
          toast.success(`${config.title} entry added successfully`);
        } catch (error) {
          console.error('Failed to add entry:', error);
          toast.error('Failed to add entry');
          setRows(prev => prev.filter(row => !row.id.toString().startsWith('temp-')));
        }
      });
    }
  };

  // Handle delete with proper startTransition
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      // Add optimistic update within the transition
      addOptimisticRow({ type: 'delete', id });

      try {
        await deleteEntry(id);
        setRows(prev => prev.filter(row => row.id !== id));
        toast.success('Entry deleted successfully');
      } catch (error) {
        console.error('Failed to delete entry:', error);
        toast.error('Failed to delete entry');
        const entries = await fetchSectionEntries(sessionId, config.section);
        setRows(entries);
      }
    });
  };

  // Handle flag toggle with proper startTransition
  const handleFlag = async (id: string, shouldFlag: boolean) => {
    startTransition(async () => {
      // Add optimistic update within the transition
      addOptimisticRow({ type: shouldFlag ? 'flag' : 'unflag', id });

      try {
        if (shouldFlag) {
          await flagEntry(id, { flag: 'important' });
        } else {
          await clearFlag(id);
        }

        const entries = await fetchSectionEntries(sessionId, config.section);
        setRows(entries);
        toast.success(shouldFlag ? 'Entry flagged' : 'Flag cleared');
      } catch (error) {
        console.error('Failed to update flag:', error);
        toast.error('Failed to update flag');
        const entries = await fetchSectionEntries(sessionId, config.section);
        setRows(entries);
      }
    });
  };

  // Render custom field
  const renderCustomField = (field: any) => {
    // Check if field should be shown
    if (field.conditional && !field.conditional(form)) {
      return null;
    }

    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label} {field.required && '*'}</Label>
            <Select
              value={form[field.key] || ''}
              onValueChange={(value) => setForm({ ...form, [field.key]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'rich-text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <RichTextEditor
              content={form[field.key] || ''}
              onChange={(content) => setForm({ ...form, [field.key]: content })}
              placeholder={field.placeholder}
            />
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label} {field.required && '*'}</Label>
            <Input
              id={field.key}
              type={field.type === 'url' ? 'url' : 'text'}
              placeholder={field.placeholder}
              value={form[field.key] || ''}
              onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              required={field.required}
            />
          </div>
        );
    }
  };

  // Prepare columns for table - include all content columns
  const tableColumns = [
    ...config.columns,
    ...(config.hasStatusDropdown ? [{ key: 'status', label: 'Status' }] : []),
    ...(config.hasSubAppSelection ? [{ key: 'selectedSubApps', label: 'Sub-Apps' }] : []),
    // Include description and comments columns for full visibility
    { key: 'description', label: 'Description' },
    { key: 'comments', label: 'Comments' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {config.title}
          <Button
            size="sm"
            onClick={() => {
              setEditingEntry(null);
              setForm(getInitialFormState());
              setOpen(true);
            }}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {config.customTableRenderer ? (
          config.customTableRenderer({
            rows: optimisticRows,
            onDelete: handleDelete,
            onFlag: (id: string) => handleFlag(id, true),
            onClearFlag: (id: string) => handleFlag(id, false),
            onEdit: handleEdit,
            isLoading: isPending,
            subApplications,
          })
        ) : (
          <EnhancedEntryTable
            rows={optimisticRows}
            columns={tableColumns}
            onDelete={handleDelete}
            onFlag={(id) => handleFlag(id, true)}
            onClearFlag={(id) => handleFlag(id, false)}
            onEdit={handleEdit}
            isLoading={isPending}
            section={config.section}
            subApplications={subApplications}
            statusOptions={config.statusOptions}
          />
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? `Edit ${config.title}` : `Add ${config.title}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Render standard columns */}
            {config.columns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.columns.map(col => (
                  <div key={col.key} className="space-y-2">
                    <Label htmlFor={col.key}>{col.label} {col.required && '*'}</Label>
                    <Input
                      id={col.key}
                      placeholder={col.label}
                      value={form[col.key] || ''}
                      onChange={e => setForm({ ...form, [col.key]: e.target.value })}
                      required={col.required}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Render custom fields */}
            {config.customFields?.map(renderCustomField)}

            {/* Status Dropdown */}
            {config.hasStatusDropdown && config.statusOptions && (
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={form.status || ''} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sub-Application Selection */}
            {config.hasSubAppSelection && subApplications.length > 0 && (
              <div className="space-y-3">
                <Label>Sub-Applications</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {subApplications.map((subApp) => (
                    <div key={subApp.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subapp-${subApp.id}`}
                        checked={form.selectedSubApps?.includes(subApp.id) || false}
                        onCheckedChange={() => handleSubAppToggle(subApp.id)}
                      />
                      <Label
                        htmlFor={`subapp-${subApp.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {subApp.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {form.selectedSubApps?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.selectedSubApps.map((subAppId: string) => {
                      const subApp = subApplications.find(sa => sa.id === subAppId);
                      return subApp ? (
                        <Badge key={subAppId} variant="secondary" className="text-xs">
                          {subApp.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Rich Text Fields */}
            {config.hasRichTextComments && (
              <>
                {/* Description - Simple rich text */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <RichTextEditor
                    content={form.description || ''}
                    onChange={(content) => setForm({ ...form, description: content })}
                    placeholder="Add detailed description..."
                  />
                </div>

                {/* Comments - Compact with date picker */}
                <RichTextEditor
                  content={form.comments || ''}
                  onChange={(content) => setForm({ ...form, comments: content })}
                  placeholder="Add comments..."
                />
              </>
            )}

            {/* Mark as Important */}
            {config.hasImportantFlag && (
              <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Checkbox
                  id="isImportant"
                  checked={form.isImportant || false}
                  onCheckedChange={(checked) => setForm({ ...form, isImportant: !!checked })}
                />
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="isImportant" className="cursor-pointer text-orange-900">
                    Mark as Important for Next Shift
                  </Label>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setEditingEntry(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEntry ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
