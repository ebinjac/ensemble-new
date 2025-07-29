// app/components/link-manager/ImportDialog.tsx
'use client'

import { useState } from 'react';
import { Upload, FileText, Link2, Download, CheckCircle, AlertCircle, X, Eye, Brain, Settings, Sparkles, RotateCcw, Edit2, Save, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { importLinks, parseImportFile } from '@/app/actions/link-manager/link-import';
import type { ImportLinkData, ImportResult, ImportSettings, ParsedLink } from '@/components/link-manager/types/link-import';
import { classifyLink } from './lib/intelligent-classifier';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Switch } from '../ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  applications: Array<{
    id: string;
    applicationName: string;
    tla: string;
    status: string;
  }>;
  onSuccess: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  teamId,
  applications,
  onSuccess
}: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState('file');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'complete'>('input');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Text paste state
  const [pastedText, setPastedText] = useState('');

  // URL list state
  const [urlList, setUrlList] = useState('');

  // Preview state
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());
  const [defaultCategory, setDefaultCategory] = useState<string>('other');
  const [defaultApplicationIds, setDefaultApplicationIds] = useState<string[]>([]);

  // Import progress
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [importSettings, setImportSettings] = useState<ImportSettings>({
    enableIntelligentCategorization: true,
    enableIntelligentTagging: true,
    autoApplyHighConfidence: false,
    defaultCategory: 'other',
    defaultApplicationIds: []
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState<ParsedLink | null>(null);
  const [showIntelligentSettings, setShowIntelligentSettings] = useState(false);

  const [bulkApplicationId, setBulkApplicationId] = useState<string>('');
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/csv',
      'application/json',
      'text/markdown',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please select a file smaller than 10MB",
      });
      return;
    }

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
      toast.error("Unsupported file type", {
        description: "Please select a CSV, JSON, Markdown, or text file",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleParse = async () => {
    setLoading(true);
    try {
      let parseData: ImportLinkData;

      if (activeTab === 'file' && selectedFile) {
        parseData = { type: 'file', file: selectedFile, teamId };
      } else if (activeTab === 'text' && pastedText.trim()) {
        parseData = { type: 'text', content: pastedText.trim(), teamId };
      } else if (activeTab === 'urls' && urlList.trim()) {
        parseData = { type: 'urls', content: urlList.trim(), teamId };
      } else {
        toast.error("No data to parse", {
          description: "Please provide some data to import",
        });
        return;
      }

      // ✅ Pass import settings to server
      const result = await parseImportFile(parseData, importSettings);

      if (result.success && result.links) {
        setParsedLinks(result.links);
        setSelectedLinks(new Set(result.links.map((_, index) => index)));
        setStep('preview');
      } else {
        toast.error("Parse failed", {
          description: result.error || "Failed to parse the data",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to parse the data",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleImport = async () => {
    const linksToImport = parsedLinks.filter((_, index) => selectedLinks.has(index));

    if (linksToImport.length === 0) {
      toast.error("No links selected", {
        description: "Please select at least one link to import",
      });
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      const importData = linksToImport.map(link => ({
        ...link,
        category: link.category || defaultCategory,
        applicationIds: link.applicationIds?.length && link.applicationIds.length > 0 ? link.applicationIds : defaultApplicationIds,
      }));

      // ✅ Simulate progress on client side while import runs
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) return prev; // Cap at 90% until actual completion
          return prev + Math.random() * 15; // Random increment
        });
      }, 200);

      // ✅ Call server action without progress callback
      const result = await importLinks(teamId, importData);

      // ✅ Clear interval and set to 100%
      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult(result);
      setStep('complete');

      if (result.success) {
        toast.success("Import successful", {
          description: `Successfully imported ${result.successCount} links`,
        });
        onSuccess();
      } else {
        toast.error("Import completed with errors", {
          description: `${result.successCount} successful, ${result.errorCount} failed`,
        });
      }
    } catch (error) {
      toast.error("Import failed", {
        description: "Failed to import links",
      });
      setStep('preview');
    }
  };

  const removeTagFromEditingLink = (tagIndex: number) => {
    if (editingLink && editingLink.tags) {
      const newTags = editingLink.tags.filter((_, i) => i !== tagIndex);
      setEditingLink({ ...editingLink, tags: newTags });
    }
  };

  // ✅ Add tag function
  const addTagToEditingLink = (tag: string) => {
    if (editingLink && tag.trim()) {
      const currentTags = editingLink.tags || [];
      if (!currentTags.includes(tag.trim())) {
        setEditingLink({
          ...editingLink,
          tags: [...currentTags, tag.trim()]
        });
      }
    }
  };

  const updateLinkApplications = (index: number, applicationIds: string[]) => {
    const updatedLinks = [...parsedLinks];
    updatedLinks[index] = { ...updatedLinks[index], applicationIds, isEdited: true };
    setParsedLinks(updatedLinks);
  };

  const bulkAssignApplication = () => {
    if (bulkApplicationId) {
      const updatedLinks = parsedLinks.map((link, index) => {
        if (selectedLinks.has(index)) {
          const currentAppIds = link.applicationIds || [];
          const newAppIds = currentAppIds.includes(bulkApplicationId)
            ? currentAppIds
            : [...currentAppIds, bulkApplicationId];
          return { ...link, applicationIds: newAppIds, isEdited: true };
        }
        return link;
      });
      setParsedLinks(updatedLinks);
      setBulkApplicationId('');
      setShowBulkAssign(false);

      toast.success("Success", {
        description: `Assigned application to ${selectedLinks.size} links`,
      });
    }
  };



  const toggleLinkSelection = (index: number) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLinks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLinks.size === parsedLinks.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(parsedLinks.map((_, index) => index)));
    }
  };

  const resetDialog = () => {
    setStep('input');
    setSelectedFile(null);
    setPastedText('');
    setUrlList('');
    setParsedLinks([]);
    setSelectedLinks(new Set());
    setImportProgress(0);
    setImportResult(null);
    setActiveTab('file');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };



  // ✅ Inline editing functions
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingLink({ ...parsedLinks[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingLink(null);
  };

  const saveEditing = () => {
    if (editingIndex !== null && editingLink) {
      const updatedLinks = [...parsedLinks];
      updatedLinks[editingIndex] = { ...editingLink, isEdited: true };
      setParsedLinks(updatedLinks);
      setEditingIndex(null);
      setEditingLink(null);
    }
  };

  const applyIntelligentSuggestions = (index: number) => {
    const link = parsedLinks[index];
    if (link.suggestedCategory || link.suggestedTags) {
      const updatedLinks = [...parsedLinks];
      updatedLinks[index] = {
        ...link,
        category: importSettings.enableIntelligentCategorization ?
          (link.suggestedCategory || link.category) : link.category,
        tags: importSettings.enableIntelligentTagging ?
          [...(link.tags || []), ...(link.suggestedTags || [])] : link.tags,
        isEdited: true
      };
      setParsedLinks(updatedLinks);
    }
  };

  const reRunIntelligentClassification = (index: number) => {
    const link = parsedLinks[index];
    const classification = classifyLink(link.title, link.url, link.description);

    const updatedLinks = [...parsedLinks];
    updatedLinks[index] = {
      ...link,
      suggestedCategory: classification.suggestedCategory,
      suggestedTags: classification.suggestedTags,
      confidence: classification.confidence,
      matchedRules: classification.matchedRules
    };
    setParsedLinks(updatedLinks);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className=" max-h-[90vh] min-w-[90vw] overflow-y-auto overflow-x-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Links
          </DialogTitle>
          <DialogDescription>
            Import links from various sources into your Link Manager
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6">
            {/* ✅ Intelligent Settings Panel */}
            <Collapsible open={showIntelligentSettings} onOpenChange={setShowIntelligentSettings}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Enhancement Settings
                  </div>
                  <Settings className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4 border rounded-lg p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Smart Categorization</Label>
                        <p className="text-xs text-muted-foreground">
                          Auto-suggest categories based on URL and content
                        </p>
                      </div>
                      <Switch
                        checked={importSettings.enableIntelligentCategorization}
                        onCheckedChange={(checked) =>
                          setImportSettings(prev => ({ ...prev, enableIntelligentCategorization: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Smart Tagging</Label>
                        <p className="text-xs text-muted-foreground">
                          Auto-suggest relevant tags for monitoring tools, etc.
                        </p>
                      </div>
                      <Switch
                        checked={importSettings.enableIntelligentTagging}
                        onCheckedChange={(checked) =>
                          setImportSettings(prev => ({ ...prev, enableIntelligentTagging: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Auto-Apply High Confidence</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically apply suggestions with 80%+ confidence
                        </p>
                      </div>
                      <Switch
                        checked={importSettings.autoApplyHighConfidence}
                        onCheckedChange={(checked) =>
                          setImportSettings(prev => ({ ...prev, autoApplyHighConfidence: checked }))
                        }
                      />
                    </div>

                    <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3 w-3 text-blue-600" />
                        <span className="font-medium text-blue-800">AI Recognition Examples:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Splunk, Dynatrace → monitoring, analytics tags</li>
                        <li>GitLab, GitHub → repository category</li>
                        <li>Jira, ServiceNow → project management tags</li>
                        <li>Confluence → documentation category</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Content
                </TabsTrigger>
                <TabsTrigger value="urls" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  URL List
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setDragActive(true)}
                    onDragLeave={() => setDragActive(false)}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 mx-auto text-primary" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-lg font-medium">Drop your file here</p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse
                          </p>
                        </div>
                        <Input
                          type="file"
                          className="max-w-xs mx-auto"
                          accept=".csv,.json,.md,.txt,.xlsx,.xls"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Supported formats: CSV, JSON, Markdown, Text, Excel (.csv, .json, .md, .txt, .xlsx, .xls)
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="pastedText">Paste Content</Label>
                  <Textarea
                    className='max-h-[200px] max-w-[87vw]'
                    id="pastedText"
                    placeholder="Paste your content here... 

Examples:
• Confluence exported content
• Markdown with links
• HTML with links
• Any text containing URLs"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={12}
                  />
                  <div className="text-xs text-muted-foreground">
                    Paste content from Confluence, OneNote, or any text containing URLs
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="urls" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urlList">URL List</Label>
                  <Textarea
                    id="urlList"
                    placeholder="Enter URLs, one per line:

https://example.com
https://another-site.com
https://internal.aexp.com/dashboard

Or with titles:
My Dashboard | https://dashboard.aexp.com
Documentation | https://docs.example.com"
                    value={urlList}
                    onChange={(e) => setUrlList(e.target.value)}
                    rows={10}
                  />
                  <div className="text-xs text-muted-foreground">
                    One URL per line, optionally with title separated by " | "
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Preview & Edit Links
                <Badge variant="secondary">
                  {selectedLinks.size} of {parsedLinks.length} selected
                </Badge>
              </h3>

              <div className="flex items-center gap-2">
                {/* ✅ Bulk Application Assignment */}
                <AlertDialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={selectedLinks.size === 0}>
                      <Building2 className="h-3 w-3 mr-1" />
                      Assign Application
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Assign Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Assign an application to {selectedLinks.size} selected links
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label>Select Application</Label>
                      <Select value={bulkApplicationId} onValueChange={setBulkApplicationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose application" />
                        </SelectTrigger>
                        <SelectContent>
                          {applications.filter(app => app.status === 'active').map(app => (
                            <SelectItem key={app.id} value={app.id}>
                              {app.tla} - {app.applicationName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={bulkAssignApplication} disabled={!bulkApplicationId}>
                        Assign to {selectedLinks.size} Links
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updatedLinks = parsedLinks.map(link => {
                      if (link.confidence && link.confidence > 70) {
                        return {
                          ...link,
                          category: importSettings.enableIntelligentCategorization ?
                            (link.suggestedCategory || link.category) : link.category,
                          tags: importSettings.enableIntelligentTagging ?
                            [...(link.tags || []), ...(link.suggestedTags || [])] : link.tags,
                          isEdited: true
                        };
                      }
                      return link;
                    });
                    setParsedLinks(updatedLinks);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Apply All AI Suggestions
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLinks.size === parsedLinks.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-48">Title</TableHead>
                    <TableHead className="w-48">URL</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                    <TableHead className="w-48">Tags</TableHead>
                    <TableHead className="w-40">Applications</TableHead> {/* ✅ New column */}
                    <TableHead className="w-20">AI Score</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLinks.map((link, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLinks.has(index)}
                          onCheckedChange={() => toggleLinkSelection(index)}
                        />
                      </TableCell>

                      {/* Title - same as before */}
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editingLink?.title || ''}
                            onChange={(e) => setEditingLink(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="h-8"
                          />
                        ) : (
                          <div className="truncate font-medium" title={link.title}>
                            {link.title}
                            {link.isEdited && <span className="text-blue-600 ml-1">*</span>}
                          </div>
                        )}
                      </TableCell>

                      {/* URL - same as before */}
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={editingLink?.url || ''}
                            onChange={(e) => setEditingLink(prev => prev ? { ...prev, url: e.target.value } : null)}
                            className="h-8"
                          />
                        ) : (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block"
                            title={link.url}
                          >
                            {link.url}
                          </a>
                        )}
                      </TableCell>

                      {/* Category - same as before */}
                      <TableCell>
                        {editingIndex === index ? (
                          <Select
                            value={editingLink?.category || 'other'}
                            onValueChange={(value) => setEditingLink(prev => prev ? { ...prev, category: value } : null)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="documentation">Documentation</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="resource">Resource</SelectItem>
                              <SelectItem value="dashboard">Dashboard</SelectItem>
                              <SelectItem value="repository">Repository</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline">
                              {link.category || importSettings.defaultCategory}
                            </Badge>
                            {link.suggestedCategory && link.suggestedCategory !== link.category && (
                              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                AI: {link.suggestedCategory}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* ✅ Fixed Tags Editing */}
                      <TableCell>
                        {editingIndex === index ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                              {(editingLink?.tags || []).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs flex items-center gap-1">
                                  #{tag}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeTagFromEditingLink(tagIndex);
                                    }}
                                    className="hover:bg-red-100 rounded-full p-0.5"
                                  >
                                    <X className="h-2 w-2 text-red-600" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <Input
                              placeholder="Add tag (press Enter)"
                              className="h-6 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const value = e.currentTarget.value.trim();
                                  if (value) {
                                    addTagToEditingLink(value);
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {(link.tags || []).slice(0, 2).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {(link.tags || []).length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(link.tags || []).length - 2}
                                </Badge>
                              )}
                            </div>
                            {link.suggestedTags && link.suggestedTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {link.suggestedTags.slice(0, 2).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                    AI: #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* ✅ New Applications Column */}
                      <TableCell>
                        {editingIndex === index ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                              {(editingLink?.applicationIds || []).map((appId) => {
                                const app = applications.find(a => a.id === appId);
                                return app ? (
                                  <Badge key={appId} variant="outline" className="text-xs flex items-center gap-1">
                                    {app.tla}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (editingLink) {
                                          const newAppIds = editingLink.applicationIds?.filter(id => id !== appId) || [];
                                          setEditingLink({ ...editingLink, applicationIds: newAppIds });
                                        }
                                      }}
                                      className="hover:bg-red-100 rounded-full p-0.5"
                                    >
                                      <X className="h-2 w-2 text-red-600" />
                                    </button>
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                            <Select
                              value=""
                              onValueChange={(appId) => {
                                if (editingLink && appId) {
                                  const currentAppIds = editingLink.applicationIds || [];
                                  if (!currentAppIds.includes(appId)) {
                                    setEditingLink({
                                      ...editingLink,
                                      applicationIds: [...currentAppIds, appId]
                                    });
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue placeholder="Add app" />
                              </SelectTrigger>
                              <SelectContent>
                                {applications.filter(app =>
                                  app.status === 'active' &&
                                  !(editingLink?.applicationIds || []).includes(app.id)
                                ).map(app => (
                                  <SelectItem key={app.id} value={app.id}>
                                    {app.tla} - {app.applicationName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(link.applicationIds || []).slice(0, 2).map((appId) => {
                              const app = applications.find(a => a.id === appId);
                              return app ? (
                                <Badge key={appId} variant="outline" className="text-xs">
                                  {app.tla}
                                </Badge>
                              ) : null;
                            })}
                            {(link.applicationIds || []).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(link.applicationIds || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* AI Score - same as before */}
                      <TableCell>
                        {link.confidence !== undefined && (
                          <div className="flex items-center gap-1">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${link.confidence > 80 ? 'bg-green-500' :
                                    link.confidence > 60 ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`}
                                style={{ width: `${link.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {link.confidence}%
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Actions - enhanced */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {editingIndex === index ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={saveEditing}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(index)}
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {(link.suggestedCategory || link.suggestedTags) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => applyIntelligentSuggestions(index)}
                                  title="Apply AI suggestions"
                                  className="text-blue-600"
                                >
                                  <Sparkles className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reRunIntelligentClassification(index)}
                                title="Re-run AI analysis"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Importing Links</h3>
              <p className="text-muted-foreground">
                Please wait while we import your links...
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
              <p className="text-muted-foreground">
                Your links have been imported successfully
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.successCount}
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.duplicateCount || 0}
                </div>
                <div className="text-sm text-yellow-700">Duplicates</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errorCount}
                </div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Errors</Label>
                <ScrollArea className="h-32 border rounded-lg p-3">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      {error}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={loading}>
                {loading ? 'Processing...' : 'Parse & Analyze with AI'}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedLinks.size === 0}>
                Import {selectedLinks.size} Links
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
