// app/components/link-manager/ImportWorkflow.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload, FileText, Link2, Download, CheckCircle, AlertCircle, X, Eye,
    Edit2, Save, RotateCcw, Sparkles, Settings, Brain, ArrowLeft, ArrowRight,
    Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { parseImportFile, importLinks } from '@/app/actions/link-manager/link-import';
import { classifyLink } from '@/components/link-manager/lib/intelligent-classifier';
import type { ImportLinkData, ParsedLink, ImportResult, ImportSettings } from '@/components/link-manager/types/link-import';

interface ImportWorkflowProps {
    teamId: string;
    userRole: 'admin' | 'user';
    teamApplications: Array<{
        id: string;
        applicationName: string;
        tla: string;
        status: string;
    }>;
}

export function ImportWorkflow({ teamId, userRole, teamApplications }: ImportWorkflowProps) {
    const router = useRouter();

    // Step management
    const [currentStep, setCurrentStep] = useState<'input' | 'preview' | 'importing' | 'complete'>('input');
    const [activeTab, setActiveTab] = useState('file');
    const [loading, setLoading] = useState(false);

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

    // Import settings
    const [importSettings, setImportSettings] = useState<ImportSettings>({
        enableIntelligentCategorization: true,
        enableIntelligentTagging: true,
        autoApplyHighConfidence: false,
        defaultCategory: 'other',
        defaultApplicationIds: []
    });

    // Editing state
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingLink, setEditingLink] = useState<ParsedLink | null>(null);
    const [showIntelligentSettings, setShowIntelligentSettings] = useState(false);

    // Bulk operations
    const [bulkApplicationId, setBulkApplicationId] = useState<string>('');
    const [showBulkAssign, setShowBulkAssign] = useState(false);

    // Import progress
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // File handling
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

    // Parse function
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

            const result = await parseImportFile(parseData, importSettings);

            if (result.success && result.links) {
                setParsedLinks(result.links);
                setSelectedLinks(new Set(result.links.map((_, index) => index)));
                setCurrentStep('preview');
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

    // Editing functions
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

    const removeTagFromEditingLink = (tagIndex: number) => {
        if (editingLink && editingLink.tags) {
            const newTags = editingLink.tags.filter((_, i) => i !== tagIndex);
            setEditingLink({ ...editingLink, tags: newTags });
        }
    };

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

    // Selection functions
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

    // Bulk operations
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

    // Import function
    const handleImport = async () => {
        const linksToImport = parsedLinks.filter((_, index) => selectedLinks.has(index));

        if (linksToImport.length === 0) {
            toast.error("No links selected", {
                description: "Please select at least one link to import",
            });
            return;
        }

        setCurrentStep('importing');
        setImportProgress(0);

        try {
            const importData = linksToImport.map(link => ({
                ...link,
                category: link.category || importSettings.defaultCategory,
                applicationIds: link.applicationIds && link.applicationIds.length > 0 ? link.applicationIds : importSettings.defaultApplicationIds,
            }));

            // Simulate progress on client side while import runs
            const progressInterval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 15;
                });
            }, 200);

            const result = await importLinks(teamId, importData);

            clearInterval(progressInterval);
            setImportProgress(100);

            setImportResult(result);
            setCurrentStep('complete');

            if (result.success) {
                toast.success("Import successful", {
                    description: `Successfully imported ${result.successCount} links`,
                });
            } else {
                toast.error("Import completed with errors", {
                    description: `${result.successCount} successful, ${result.errorCount} failed`,
                });
            }
        } catch (error) {
            toast.error("Import failed", {
                description: "Failed to import links",
            });
            setCurrentStep('preview');
        }
    };

    const handleGoBack = () => {
        router.push(`/tools/teams/${teamId}/link-manager`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={handleGoBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Links
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Import Links</h1>
                            <p className="text-muted-foreground mt-1">
                                Import links from various sources with AI-powered categorization and tagging
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center space-x-2">
                    {['Input', 'Preview', 'Import', 'Complete'].map((step, index) => {
                        const stepKeys = ['input', 'preview', 'importing', 'complete'];
                        const isActive = stepKeys[index] === currentStep;
                        const isCompleted = stepKeys.indexOf(currentStep) > index;

                        return (
                            <div key={step} className="flex items-center">
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? 'bg-primary text-primary-foreground' :
                                        isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                                </div>
                                <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                                    {step}
                                </span>
                                {index < 3 && <ArrowRight className="h-4 w-4 mx-3 text-gray-400" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 1: Input */}
            {currentStep === 'input' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Input Area */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Select Import Source
                                </CardTitle>
                                <CardDescription>
                                    Choose how you want to import your links
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
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

                                    <TabsContent value="file" className="space-y-4 mt-6">
                                        <div className="space-y-2">
                                            <Label>Upload File</Label>
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'
                                                    }`}
                                                onDrop={handleDrop}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDragEnter={() => setDragActive(true)}
                                                onDragLeave={() => setDragActive(false)}
                                            >
                                                {selectedFile ? (
                                                    <div className="space-y-4">
                                                        <FileText className="h-16 w-16 mx-auto text-primary" />
                                                        <div>
                                                            <p className="font-medium text-lg">{selectedFile.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setSelectedFile(null)}
                                                        >
                                                            Remove File
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                                                        <div>
                                                            <p className="text-xl font-medium">Drop your file here</p>
                                                            <p className="text-muted-foreground mt-2">
                                                                or click to browse your computer
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
                                            <div className="text-sm text-muted-foreground">
                                                Supported formats: CSV, JSON, Markdown, Text, Excel (.csv, .json, .md, .txt, .xlsx, .xls)
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="text" className="space-y-4 mt-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="pastedText">Paste Content</Label>
                                            <Textarea
                                                id="pastedText"
                                                placeholder="Paste your content here... 

Examples:
• Confluence exported content
• Markdown with links
• HTML with links
• Any text containing URLs"
                                                value={pastedText}
                                                onChange={(e) => setPastedText(e.target.value)}
                                                className="min-h-[300px] resize-y"
                                            />
                                            <div className="text-sm text-muted-foreground">
                                                Paste content from Confluence, OneNote, or any text containing URLs
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="urls" className="space-y-4 mt-6">
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
                                                className="min-h-[300px] resize-y"
                                            />
                                            <div className="text-sm text-muted-foreground">
                                                One URL per line, optionally with title separated by " | "
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Settings Sidebar */}
                    <div className="space-y-6">
                        {/* AI Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5" />
                                    AI Enhancement
                                </CardTitle>
                                <CardDescription>
                                    Configure intelligent categorization and tagging
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>

                        {/* Default Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Default Settings</CardTitle>
                                <CardDescription>
                                    Default values for imported links
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Default Category</Label>
                                    <Select
                                        value={importSettings.defaultCategory}
                                        onValueChange={(value) => setImportSettings(prev => ({ ...prev, defaultCategory: value }))}
                                    >
                                        <SelectTrigger>
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
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Application</Label>
                                    <Select
                                        value={importSettings.defaultApplicationIds[0] || 'none'} // ✅ Use 'none' instead of ''
                                        onValueChange={(value) => setImportSettings(prev => ({
                                            ...prev,
                                            defaultApplicationIds: value === 'none' ? [] : [value] // ✅ Handle 'none' case
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select application" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem> {/* ✅ Use 'none' instead of empty string */}
                                            {teamApplications.filter(app => app.status === 'active').map(app => (
                                                <SelectItem key={app.id} value={app.id}>
                                                    {app.tla} - {app.applicationName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Examples */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    AI Recognition Examples
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Monitoring:</span>
                                        <p className="text-muted-foreground">Splunk, Dynatrace → monitoring, analytics tags</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Development:</span>
                                        <p className="text-muted-foreground">GitLab, GitHub → repository category</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Documentation:</span>
                                        <p className="text-muted-foreground">Confluence → documentation category</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Project Management:</span>
                                        <p className="text-muted-foreground">Jira, ServiceNow → project management tags</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Button */}
                        <Button
                            onClick={handleParse}
                            disabled={loading || (!selectedFile && !pastedText.trim() && !urlList.trim())}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? 'Processing...' : 'Parse & Analyze with AI'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Preview (This would be much longer, showing the full preview table) */}
            {currentStep === 'preview' && (
                <div className="space-y-6">
                    {/* Preview Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        Preview & Edit Links
                                        <Badge variant="secondary">
                                            {selectedLinks.size} of {parsedLinks.length} selected
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Review and edit your links before importing. Use AI suggestions or edit manually.
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Bulk Application Assignment */}
                                    <AlertDialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" disabled={selectedLinks.size === 0}>
                                                <Building2 className="h-4 w-4 mr-2" />
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
                                                        {teamApplications.filter(app => app.status === 'active').map(app => (
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
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Apply All AI Suggestions
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Preview Table - Now with proper spacing */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedLinks.size === parsedLinks.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead className="min-w-[200px]">Title</TableHead>
                                            <TableHead className="min-w-[250px]">URL</TableHead>
                                            <TableHead className="min-w-[120px]">Category</TableHead>
                                            <TableHead className="min-w-[200px]">Tags</TableHead>
                                            <TableHead className="min-w-[150px]">Applications</TableHead>
                                            <TableHead className="w-24">AI Score</TableHead>
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

                                                {/* Title */}
                                                <TableCell>
                                                    {editingIndex === index ? (
                                                        <Input
                                                            value={editingLink?.title || ''}
                                                            onChange={(e) => setEditingLink(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                            className="min-w-[180px]"
                                                        />
                                                    ) : (
                                                        <div className="font-medium" title={link.title}>
                                                            {link.title}
                                                            {link.isEdited && <span className="text-blue-600 ml-1">*</span>}
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* URL */}
                                                <TableCell>
                                                    {editingIndex === index ? (
                                                        <Input
                                                            value={editingLink?.url || ''}
                                                            onChange={(e) => setEditingLink(prev => prev ? { ...prev, url: e.target.value } : null)}
                                                            className="min-w-[200px]"
                                                        />
                                                    ) : (
                                                        <a
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline break-all"
                                                            title={link.url}
                                                        >
                                                            {link.url}
                                                        </a>
                                                    )}
                                                </TableCell>

                                                {/* Category */}
                                                <TableCell>
                                                    {editingIndex === index ? (
                                                        <Select
                                                            value={editingLink?.category || 'other'}
                                                            onValueChange={(value) => setEditingLink(prev => prev ? { ...prev, category: value } : null)}
                                                        >
                                                            <SelectTrigger>
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
                                                        <div className="space-y-1">
                                                            <Badge variant="outline">
                                                                {link.category || importSettings.defaultCategory}
                                                            </Badge>
                                                            {link.suggestedCategory && link.suggestedCategory !== link.category && (
                                                                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 block w-fit">
                                                                    AI: {link.suggestedCategory}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Tags */}
                                                <TableCell>
                                                    {editingIndex === index ? (
                                                        <div className="space-y-2 min-w-[180px]">
                                                            <div className="flex flex-wrap gap-1">
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
                                                                className="text-xs"
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
                                                                {(link.tags || []).slice(0, 3).map((tag, tagIndex) => (
                                                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                                                        #{tag}
                                                                    </Badge>
                                                                ))}
                                                                {(link.tags || []).length > 3 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        +{(link.tags || []).length - 3}
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

                                                {/* Applications */}
                                                <TableCell>
                                                    {editingIndex === index ? (
                                                        <div className="space-y-2 min-w-[130px]">
                                                            <div className="flex flex-wrap gap-1">
                                                                {(editingLink?.applicationIds || []).map((appId) => {
                                                                    const app = teamApplications.find(a => a.id === appId);
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
                                                                value="add-app" // ✅ Use a fixed value instead of empty string
                                                                onValueChange={(appId) => {
                                                                    if (editingLink && appId && appId !== 'add-app') { // ✅ Check it's not the placeholder
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
                                                                <SelectTrigger className="text-xs">
                                                                    <SelectValue placeholder="Add app" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="add-app" disabled>Add application...</SelectItem> {/* ✅ Disabled placeholder item */}
                                                                    {teamApplications.filter(app =>
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
                                                                const app = teamApplications.find(a => a.id === appId);
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

                                                {/* AI Score */}
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

                                                {/* Actions */}
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
                                                                        onClick={() => {
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
                                                                        }}
                                                                        title="Apply AI suggestions"
                                                                        className="text-blue-600"
                                                                    >
                                                                        <Sparkles className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={() => setCurrentStep('input')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Input
                        </Button>
                        <Button onClick={handleImport} disabled={selectedLinks.size === 0} size="lg">
                            Import {selectedLinks.size} Links
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Importing */}
            {currentStep === 'importing' && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center space-y-6">
                            <Upload className="h-16 w-16 mx-auto text-primary animate-pulse" />
                            <div>
                                <h3 className="text-2xl font-semibold mb-2">Importing Links</h3>
                                <p className="text-muted-foreground">
                                    Please wait while we import your {selectedLinks.size} selected links...
                                </p>
                            </div>
                            <div className="space-y-2 max-w-md mx-auto">
                                <div className="flex justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{importProgress}%</span>
                                </div>
                                <Progress value={importProgress} className="w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Complete */}
            {currentStep === 'complete' && importResult && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center space-y-6">
                            <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                            <div>
                                <h3 className="text-2xl font-semibold mb-2">Import Complete!</h3>
                                <p className="text-muted-foreground">
                                    Your links have been successfully imported into the Link Manager
                                </p>
                            </div>

                            {/* ✅ Updated stats grid - removed duplicates column */}
                            <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                                <div className="p-6 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">
                                        {importResult.successCount}
                                    </div>
                                    <div className="text-sm text-green-700 font-medium">Successful</div>
                                </div>
                                <div className="p-6 bg-red-50 rounded-lg">
                                    <div className="text-3xl font-bold text-red-600">
                                        {importResult.errorCount}
                                    </div>
                                    <div className="text-sm text-red-700 font-medium">Errors</div>
                                </div>
                            </div>

                            {importResult.errors && importResult.errors.length > 0 && (
                                <Card className="max-w-2xl mx-auto">
                                    <CardHeader>
                                        <CardTitle className="text-red-600">Import Errors</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-32">
                                            {importResult.errors.map((error, index) => (
                                                <div key={index} className="text-sm text-red-600 mb-1">
                                                    {error}
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex items-center justify-center gap-4">
                                <Button variant="outline" onClick={() => {
                                    setCurrentStep('input');
                                    setSelectedFile(null);
                                    setPastedText('');
                                    setUrlList('');
                                    setParsedLinks([]);
                                    setSelectedLinks(new Set());
                                    setImportProgress(0);
                                    setImportResult(null);
                                }}>
                                    Import More Links
                                </Button>
                                <Button onClick={handleGoBack} size="lg">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Link Manager
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
