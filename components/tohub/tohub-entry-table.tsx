// app/tools/teams/[teamId]/tohub/components/EnhancedEntryTable.tsx
'use client';

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Trash2, CheckCircle2, Loader2, AlertTriangle, Edit, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/tohub/settings/confirmation-dialog';
import { CommentsCell } from './tohub-comment-cell';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface EnhancedEntryTableProps {
  rows: any[];
  columns: { key: string; label: string }[];
  onDelete(id: string): void;
  onFlag(id: string): void;
  onClearFlag(id: string): void;
  onEdit?: (entry: any) => void;
  isLoading?: boolean;
  section?: string;
  subApplications?: any[];
  statusOptions?: StatusOption[];
}

export function EnhancedEntryTable({
  rows,
  columns,
  onDelete,
  onFlag,
  onClearFlag,
  onEdit,
  isLoading = false,
  section,
  subApplications = [],
  statusOptions = [],
}: EnhancedEntryTableProps) {
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<{id: string, title: string} | null>(null);

  if (rows.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No entries found.</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first entry to get started.</p>
      </div>
    );
  }

  const handleDeleteClick = (entry: any) => {
    setEntryToDelete({
      id: entry.id,
      title: entry.title || entry.sectionData?.[columns[0]?.key] || 'Untitled Entry'
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDelete(entryToDelete.id);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  // Create status color mapping from statusOptions
  const getStatusColor = (statusValue: string) => {
    const statusOption = statusOptions.find(option => option.value === statusValue);
    return statusOption?.color || 'bg-muted';
  };

  const renderCellContent = (row: any, column: { key: string; label: string }) => {
    const value = row.sectionData?.[column.key] || row[column.key];
    
    switch (column.key) {
      case 'status':
        if (!value) return <span className="text-muted-foreground">-</span>;
        const statusColor = getStatusColor(value);
        const statusLabel = statusOptions.find(opt => opt.value === value)?.label || value;
        return (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="capitalize">{statusLabel}</span>
          </Badge>
        );
        
      case 'selectedSubApps':
        const subAppIds = row.sectionData?.selectedSubApps || [];
        if (!subAppIds.length) return <span className="text-muted-foreground">-</span>;
        
        return (
          <div className="flex flex-wrap gap-1">
            {subAppIds.map((subAppId: string) => {
              const subApp = subApplications.find(sa => sa.id === subAppId);
              return subApp ? (
                <Badge key={subAppId} variant="outline" className="text-xs">
                  {subApp.name}
                </Badge>
              ) : null;
            })}
          </div>
        );

      case 'type':
        // Special handling for email/slack type
        if (!value) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant={value === 'email' ? 'default' : 'secondary'} className="text-xs">
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );

      case 'priority':
        // Special handling for FYI priority
        if (!value) return <span className="text-muted-foreground">Normal</span>;
        return (
          <Badge 
            variant={
              value === 'high' ? 'destructive' :
              value === 'low' ? 'secondary' : 'default'
            }
            className="text-xs"
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        );
      
      // Display full comments without truncation
      case 'comments':
        if (!value || value.trim() === '' || value === '<p></p>') {
          return <span className="text-muted-foreground text-xs italic">No comments</span>;
        }
        
        return <CommentsCell content={value} />;
      
      case 'description':
        if (!value || value.trim() === '' || value === '<p></p>') {
          return <span className="text-muted-foreground text-xs italic">No description</span>;
        }
        
        return <CommentsCell content={value} />;
        
      default:
        return value ? (
          <span className="text-foreground">{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-md border border-border overflow-x-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              {columns.map(c => (
                <TableHead 
                  key={c.key} 
                  className={cn(
                    "text-muted-foreground font-medium whitespace-nowrap",
                    (c.key === 'comments' || c.key === 'description') && "min-w-64"
                  )}
                >
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="text-muted-foreground font-medium whitespace-nowrap min-w-32">Timestamps</TableHead>
              <TableHead className="w-[140px] text-muted-foreground font-medium whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const isOptimistic = r.id.toString().startsWith('temp-');
              const isImportant = r.isImportant || r.sectionData?.isImportant;
              
              return (
                <TableRow 
                  key={r.id} 
                  className={cn(
                    "border-b border-border hover:bg-muted/50 transition-colors",
                    r.isFlagged && "bg-yellow-50 border-yellow-200 hover:bg-yellow-100/50",
                    isImportant && !r.isFlagged && "bg-orange-50 border-orange-200 hover:bg-orange-100/50",
                    isOptimistic && "opacity-60"
                  )}
                >
                  {columns.map(c => (
                    <TableCell 
                      key={c.key} 
                      className={cn(
                        "align-top py-4",
                        (c.key === 'comments' || c.key === 'description') && "min-w-64 max-w-96"
                      )}
                    >
                      <div className="flex items-start space-x-2">
                        {renderCellContent(r, c)}
                        {isImportant && c.key === columns[0].key && (
                          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                        )}
                      </div>
                    </TableCell>
                  ))}
                  
                  {/* Timestamps Column */}
                  <TableCell className="text-xs align-top py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatTimestamp(r.createdAt)}</span>
                      </div>
                      {r.updatedAt && r.updatedAt !== r.createdAt && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="h-3 w-3" />
                          <span>Updated: {formatTimestamp(r.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Actions Column */}
                  <TableCell className="align-top py-4">
                    <div className="flex items-center space-x-1">
                      {/* Edit Button */}
                      {onEdit && (
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => onEdit(r)}
                          disabled={isOptimistic}
                          className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200"
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      
                      {/* Flag/Unflag Button */}
                      {r.isFlagged ? (
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => onClearFlag(r.id)}
                          disabled={isOptimistic}
                          className="h-8 w-8 hover:bg-green-50 hover:border-green-200"
                          title="Remove flag"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => onFlag(r.id)}
                          disabled={isOptimistic}
                          className="h-8 w-8 hover:bg-yellow-50 hover:border-yellow-200"
                          title="Flag entry"
                        >
                          <Flag className="h-4 w-4 text-yellow-600" />
                        </Button>
                      )}
                      
                      {/* Delete Button */}
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => handleDeleteClick(r)}
                        disabled={isOptimistic}
                        className="h-8 w-8 hover:bg-red-50 hover:border-red-200"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Entry"
        description={`Are you sure you want to delete "${entryToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
