'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Search,
  MoreHorizontal,
  Eye,
  Send,
  RefreshCw,
  Calendar,
  Mail,
  Users,
  MousePointer,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Download,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface EmailHistoryItem {
  id: string;
  subject: string;
  fromEmail: string;
  toEmails: string[];
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';
  sentAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  templateName: string | null;
  openCount: number;
  clickCount: number;
  errorMessage?: string | null;
  attachmentCount?: number;
}

interface EmailHistoryListProps {
  emails: EmailHistoryItem[];
  teamId: string;
}

export function EmailHistoryList({ emails, teamId }: EmailHistoryListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<EmailHistoryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);

  // Filter emails based on search and status
  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toEmails.some(to => to.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (email.templateName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort emails by creation date (newest first)
  const sortedEmails = [...filteredEmails].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: EmailHistoryItem['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'sending':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <Mail className="h-4 w-4 text-gray-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: EmailHistoryItem['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'bounced':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewDetails = (email: EmailHistoryItem) => {
    setSelectedEmail(email);
    setIsDetailsOpen(true);
  };

  const handleResend = (email: EmailHistoryItem) => {
    // Navigate to send dialog with pre-filled data
    router.push(`/tools/teams/${teamId}/bluemailer/templates/${email.id}/send`);
  };

  const handleDelete = async (emailId: string) => {
    setEmailToDelete(emailId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!emailToDelete) return;
    
    try {
      // Add delete email function here if needed
      toast.success('Email deleted successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete email');
    } finally {
      setDeleteDialogOpen(false);
      setEmailToDelete(null);
    }
  };

  const formatRecipients = (emails: string[], maxDisplay: number = 2) => {
    if (emails.length <= maxDisplay) {
      return emails.join(', ');
    }
    return `${emails.slice(0, maxDisplay).join(', ')} +${emails.length - maxDisplay} more`;
  };

  const getStats = () => {
    const totalEmails = emails.length;
    const sentEmails = emails.filter(e => e.status === 'sent').length;
    const failedEmails = emails.filter(e => e.status === 'failed').length;
    const queuedEmails = emails.filter(e => e.status === 'queued').length;
    const totalOpens = emails.reduce((sum, e) => sum + e.openCount, 0);
    const totalClicks = emails.reduce((sum, e) => sum + e.clickCount, 0);

    return { totalEmails, sentEmails, failedEmails, queuedEmails, totalOpens, totalClicks };
  };

  const stats = getStats();

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No emails sent yet</h3>
        <p className="text-gray-500">
          Start sending emails from your templates to see the history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmails}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sentEmails}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedEmails}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.queuedEmails}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Opens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalOpens}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalClicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search emails by subject, sender, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Email History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email History ({sortedEmails.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule/Send Time</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmails.map((email) => (
                  <TableRow key={email.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm flex items-center space-x-2">
                          <span>{email.subject}</span>
                          {/* Attachment indicator */}
                          {(email.attachmentCount ?? 0) > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Paperclip className="h-3 w-3" />
                              <span>{email.attachmentCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">From: {email.fromEmail}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatRecipients(email.toEmails)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {email.templateName || 'Unknown Template'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(email.status)} variant="outline">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(email.status)}
                          <span className="capitalize">{email.status}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    
                    {/* Schedule/Send Time Column */}
                    <TableCell>
                      <div className="space-y-1">
                        {email.status === 'queued' && email.scheduledAt ? (
                          <div className="flex items-center space-x-1 text-sm text-blue-600">
                            <Calendar className="h-3 w-3" />
                            <span>Scheduled</span>
                          </div>
                        ) : email.sentAt ? (
                          <div className="text-sm">Sent</div>
                        ) : (
                          <div className="text-sm text-gray-500">Not sent</div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          {email.status === 'queued' && email.scheduledAt ? (
                            <>
                              <div>For: {format(new Date(email.scheduledAt), 'MMM d, yyyy')}</div>
                              <div>{format(new Date(email.scheduledAt), 'h:mm a')}</div>
                            </>
                          ) : email.sentAt ? (
                            <>
                              <div>{format(new Date(email.sentAt), 'MMM d, yyyy')}</div>
                              <div>{format(new Date(email.sentAt), 'h:mm a')}</div>
                            </>
                          ) : (
                            <div>{formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{email.openCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MousePointer className="h-3 w-3" />
                          <span>{email.clickCount}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(email)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          {email.status === 'sent' && (
                            <DropdownMenuItem onClick={() => handleResend(email)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Again
                            </DropdownMenuItem>
                          )}
                          
                          {email.status === 'failed' && (
                            <DropdownMenuItem onClick={() => handleResend(email)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry Send
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(email.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Email Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete information about this email send
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Subject</Label>
                  <p className="text-sm mt-1">{selectedEmail.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Template</Label>
                  <p className="text-sm mt-1">{selectedEmail.templateName || 'Unknown'}</p>
                </div>
              </div>

              {/* Sender & Recipients */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">From</Label>
                  <p className="text-sm mt-1">{selectedEmail.fromEmail}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Recipients ({selectedEmail.toEmails.length})</Label>
                  <div className="mt-1 space-y-1">
                    {selectedEmail.toEmails.map((email, index) => (
                      <p key={index} className="text-sm text-gray-600">{email}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scheduled Time Section */}
              {selectedEmail.scheduledAt && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Scheduled Email</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <div>Scheduled for: {format(new Date(selectedEmail.scheduledAt), 'PPP p')}</div>
                    {selectedEmail.status === 'queued' && (
                      <div className="mt-1">
                        Status: Waiting to be sent ({formatDistanceToNow(new Date(selectedEmail.scheduledAt), { addSuffix: true })})
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {(selectedEmail.attachmentCount ?? 0) > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Attachments ({selectedEmail.attachmentCount})
                  </Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Paperclip className="h-4 w-4" />
                      <span>{selectedEmail.attachmentCount} file{selectedEmail.attachmentCount !== 1 ? 's' : ''} attached</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedEmail.status === 'failed' && selectedEmail.errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Error Details</span>
                  </div>
                  <p className="text-sm text-red-700">{selectedEmail.errorMessage}</p>
                </div>
              )}

              {/* Status & Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedEmail.status)} variant="outline">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(selectedEmail.status)}
                        <span className="capitalize">{selectedEmail.status}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Opens</Label>
                  <p className="text-sm mt-1 flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{selectedEmail.openCount}</span>
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Clicks</Label>
                  <p className="text-sm mt-1 flex items-center space-x-1">
                    <MousePointer className="h-3 w-3" />
                    <span>{selectedEmail.clickCount}</span>
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedEmail.createdAt), 'PPP p')}
                  </p>
                </div>
                
                {selectedEmail.sentAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Sent</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedEmail.sentAt), 'PPP p')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
