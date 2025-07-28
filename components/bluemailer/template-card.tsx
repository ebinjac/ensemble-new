'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Copy,
  Share2,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { EmailTemplate } from '@/db/schema/bluemailer';
import { deleteTemplate, duplicateTemplate } from '@/app/actions/bluemailer/templates';
import { toast } from 'sonner';
import { EmailSendDialog } from './email-send-dialog';

interface TemplateCardProps {
  template: EmailTemplate;
  teamId: string;
  onShare?: (templateId: string) => void;
  onPreview?: (templateId: string) => void;
  isShared?: boolean;
  canEdit?: boolean;
  canDuplicate?: boolean;
}

export function TemplateCard({
  template,
  teamId,
  onShare,
  onPreview,
  isShared = false,
  canEdit = true,
  canDuplicate = true
}: TemplateCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const handleEdit = () => {
    router.push(`/tools/teams/${teamId}/bluemailer/${template.id}`);
  };

  const handleDuplicate = async () => {
    if (!canDuplicate) return;

    setIsLoading(true);
    try {
      const result = await duplicateTemplate(teamId, template.id);
      if (result.success) {
        toast.success('Template duplicated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to duplicate template');
      }
    } catch (error) {
      toast.error('Failed to duplicate template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isShared) return;

    if (!confirm('Are you sure you want to delete this template?')) return;

    setIsLoading(true);
    try {
      const result = await deleteTemplate(teamId, template.id);
      if (result.success) {
        toast.success('Template deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete template');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-orange-100 text-orange-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'newsletter': return 'bg-blue-100 text-blue-800';
      case 'promotional': return 'bg-purple-100 text-purple-800';
      case 'transactional': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-yellow-100 text-yellow-800';
      case 'notification': return 'bg-orange-100 text-orange-800';
      case 'announcement': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-sm line-clamp-1">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(template.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}

              {canEdit && !isShared && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}

              {canDuplicate && (
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}

              {onShare && !isShared && (
                <DropdownMenuItem onClick={() => onShare(template.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              )}


              <DropdownMenuItem onClick={() => setShowSendDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => { }}>
                <Download className="h-4 w-4 mr-2" />
                Export HTML
              </DropdownMenuItem>

              {!isShared && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        {/* Template Thumbnail */}
        <div className="aspect-[4/3] bg-gray-50 rounded-md mb-3 overflow-hidden">
          {template.thumbnailUrl ? (
            <img
              src={template.thumbnailUrl}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-2xl mb-1">📧</div>
                <div className="text-xs">No Preview</div>
              </div>
            </div>
          )}
        </div>

        {/* Template Metadata */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Badge className={getCategoryColor(template.category)} variant="secondary">
              {template.category}
            </Badge>
            <Badge className={getStatusColor(template.status)} variant="secondary">
              {template.status}
            </Badge>
          </div>

          {template.usageCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full text-xs text-muted-foreground">
          {isShared ? (
            <div>Shared by {template.createdBy}</div>
          ) : (
            <div>
              Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardFooter>
      <EmailSendDialog
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        templateId={template.id}
        templateName={template.name}
        teamId={teamId}
      />
    </Card>
  );
}

