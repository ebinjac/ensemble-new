'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Send,
    Clock,
    Eye,
    MousePointer,
    Users,
    X,
    Plus,
    Loader2,
    FileText,
    ImageIcon,
    FileIcon,
    AlertCircle,
    Upload
} from 'lucide-react';
import { sendEmail, sendEmailWithAttachments } from '@/app/actions/bluemailer/email-sending';
import { toast } from 'sonner';
import { validateAttachment } from '@/lib/file-validation';

interface EmailSendDialogProps {
    isOpen: boolean;
    onClose: () => void;
    templateId: string;
    templateName: string;
    teamId: string;
}


export function EmailSendDialog({
    isOpen,
    onClose,
    templateId,
    templateName,
    teamId
}: EmailSendDialogProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'recipients' | 'content' | 'options'>('recipients');
    const [isLoading, setIsLoading] = useState(false);

    const [emailData, setEmailData] = useState({
        subject: `Email from ${templateName}`,
        fromName: '',
        fromEmail: '',
        replyTo: '',
        toEmails: [''],
        ccEmails: [''],
        bccEmails: [''],
        priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
        scheduledAt: '',
        trackOpens: false,
        trackClicks: false,
        personalizationData: {} as Record<string, any>,
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);

    const handleInputChange = (field: string, value: any) => {
        setEmailData(prev => ({ ...prev, [field]: value }));
    };

    const handleEmailArrayChange = (field: 'toEmails' | 'ccEmails' | 'bccEmails', index: number, value: string) => {
        setEmailData(prev => ({
            ...prev,
            [field]: prev[field].map((email, i) => i === index ? value : email)
        }));
    };

    const addEmailField = (field: 'toEmails' | 'ccEmails' | 'bccEmails') => {
        setEmailData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeEmailField = (field: 'toEmails' | 'ccEmails' | 'bccEmails', index: number) => {
        setEmailData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const newAttachments: File[] = [];
        const errors: string[] = [];

        files.forEach((file) => {
            const validation = validateAttachment(file);
            if (validation.valid) {
                newAttachments.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        setAttachments(prev => [...prev, ...newAttachments]);
        setAttachmentErrors(errors);

        // Clear the input
        event.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
        return <FileIcon className="h-4 w-4" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSend = async () => {
        // Validate required fields
        const validToEmails = emailData.toEmails.filter(email => email.trim() !== '');
        if (validToEmails.length === 0) {
            toast.error('At least one recipient email is required');
            return;
        }

        if (!emailData.subject.trim()) {
            toast.error('Subject is required');
            return;
        }

        setIsLoading(true);
        try {
            const result = await sendEmailWithAttachments(teamId, {
                templateId,
                subject: emailData.subject,
                fromName: emailData.fromName || undefined,
                fromEmail: emailData.fromEmail || undefined,
                replyTo: emailData.replyTo || undefined,
                toEmails: validToEmails,
                ccEmails: emailData.ccEmails.filter(email => email.trim() !== ''),
                bccEmails: emailData.bccEmails.filter(email => email.trim() !== ''),
                priority: emailData.priority,
                scheduledAt: emailData.scheduledAt ? new Date(emailData.scheduledAt) : undefined,
                trackOpens: emailData.trackOpens,
                trackClicks: emailData.trackClicks,
                personalizationData: emailData.personalizationData,
                attachments: attachments, // NEW: Pass attachments
            });

            if (result.success) {
                toast.success(emailData.scheduledAt ? 'Email scheduled successfully' : 'Email sent successfully');
                onClose();
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to send email');
            }
        } catch (error) {
            toast.error('Failed to send email');
        } finally {
            setIsLoading(false);
        }
    };

    const renderEmailFields = (
        field: 'toEmails' | 'ccEmails' | 'bccEmails',
        label: string,
        required: boolean = false
    ) => (
        <div className="space-y-2">
            <Label className="text-sm font-medium">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {emailData[field].map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <Input
                        type="email"
                        placeholder={`Enter ${label.toLowerCase()} email...`}
                        value={email}
                        onChange={(e) => handleEmailArrayChange(field, index, e.target.value)}
                        className="flex-1"
                    />
                    {emailData[field].length > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmailField(field, index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addEmailField(field)}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add {label.slice(0, -1)}
            </Button>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl min-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Send className="h-5 w-5" />
                        <span>Send Email</span>
                    </DialogTitle>
                    <DialogDescription>
                        Send "{templateName}" to your recipients
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="recipients" className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>Recipients</span>
                        </TabsTrigger>
                        <TabsTrigger value="content" className="flex items-center space-x-1">
                            <Send className="h-4 w-4" />
                            <span>Content</span>
                        </TabsTrigger>
                        <TabsTrigger value="attachments" className="flex items-center space-x-1">
                            <Upload className="h-4 w-4" />
                            <span>Attachments ({attachments.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="options" className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>Options</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recipients" className="space-y-4 mt-4">
                        {renderEmailFields('toEmails', 'To', true)}
                        {renderEmailFields('ccEmails', 'CC')}
                        {renderEmailFields('bccEmails', 'BCC')}
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="subject">Subject *</Label>
                            <Input
                                id="subject"
                                value={emailData.subject}
                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                placeholder="Enter email subject..."
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="fromName">From Name</Label>
                                <Input
                                    id="fromName"
                                    value={emailData.fromName}
                                    onChange={(e) => handleInputChange('fromName', e.target.value)}
                                    placeholder="Sender name..."
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="fromEmail">From Email</Label>
                                <Input
                                    id="fromEmail"
                                    type="email"
                                    value={emailData.fromEmail}
                                    onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                                    placeholder="sender@example.com"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="replyTo">Reply To</Label>
                            <Input
                                id="replyTo"
                                type="email"
                                value={emailData.replyTo}
                                onChange={(e) => handleInputChange('replyTo', e.target.value)}
                                placeholder="reply@example.com"
                                className="mt-1"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-4 mt-4">
                        <div>
                            <Label>File Attachments</Label>
                            <div className="mt-2 space-y-4">
                                {/* File Upload Area */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <Label htmlFor="file-upload" className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900">
                                                Drop files here or click to upload
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500">
                                                Max 10MB per file. PDF, DOC, XLS, images, and text files allowed.
                                            </span>
                                        </Label>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            multiple
                                            className="sr-only"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                </div>

                                {/* Attachment Errors */}
                                {attachmentErrors.length > 0 && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="flex">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Some files couldn't be uploaded:
                                                </h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {attachmentErrors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Attached Files List */}
                                {attachments.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Attached Files ({attachments.length})</Label>
                                        <div className="space-y-2">
                                            {attachments.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        {getFileIcon(file.type)}
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {file.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatFileSize(file.size)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAttachment(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="options" className="space-y-4 mt-4">
                        <div>
                            <Label>Priority</Label>
                            <Select value={emailData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="scheduledAt">Schedule Send (Optional)</Label>
                            <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={emailData.scheduledAt}
                                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Eye className="h-4 w-4" />
                                    <Label htmlFor="trackOpens" className="text-sm">Track Opens</Label>
                                </div>
                                <Switch
                                    id="trackOpens"
                                    checked={emailData.trackOpens}
                                    onCheckedChange={(checked) => handleInputChange('trackOpens', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <MousePointer className="h-4 w-4" />
                                    <Label htmlFor="trackClicks" className="text-sm">Track Clicks</Label>
                                </div>
                                <Switch
                                    id="trackClicks"
                                    checked={emailData.trackClicks}
                                    onCheckedChange={(checked) => handleInputChange('trackClicks', checked)}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {emailData.scheduledAt && (
                            <Badge variant="outline" className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Scheduled for {new Date(emailData.scheduledAt).toLocaleString()}</span>
                            </Badge>
                        )}
                        {attachments.length > 0 && (
                            <Badge variant="outline" className="flex items-center space-x-1">
                                <Upload className="h-3 w-3" />
                                <span>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</span>
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSend} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {emailData.scheduledAt ? 'Scheduling...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    {emailData.scheduledAt ? (
                                        <Clock className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    {emailData.scheduledAt ? 'Schedule Email' : 'Send Email'}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
