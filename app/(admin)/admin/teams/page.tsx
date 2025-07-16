'use client';

import { useState, useEffect } from 'react';
import { DIcons } from 'dicons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getTeamRegistrationRequests } from '@/app/actions/teams';
import { approveTeamRegistration, rejectTeamRegistration } from '@/app/actions/teams';
import { useToast } from '@/components/ui/toast';
import { format } from 'date-fns';
import { Cross, X } from 'lucide-react';

type TeamRequest = {
  id: string;
  teamName: string;
  contactName: string | null;
  contactEmail: string | null;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
};

export default function TeamsPage() {
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getTeamRegistrationRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team registration requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveTeamRegistration(requestId, 'admin@example.com');
      toast({
        title: 'Success',
        description: 'Team registration approved successfully',
      });
      fetchRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve team registration',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectTeamRegistration(requestId, 'admin@example.com', 'Rejected by admin');
      toast({
        title: 'Success',
        description: 'Team registration rejected successfully',
      });
      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject team registration',
        variant: 'destructive',
      });
    }
  };

  // Filter and pagination logic
  const filteredRequests = requests.filter(request =>
    request.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin">
            <DIcons.Loader className="w-8 h-8" />
          </div>
          <p className="text-sm text-muted-foreground">Loading team requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <DIcons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by team name, contact, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <div>{request.teamName}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      ID: {request.id}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{request.contactName ?? 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.contactEmail ?? 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{request.requestedBy}</TableCell>
                <TableCell>{format(request.requestedAt, 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={request.status === 'pending' ? 'outline' : 'secondary'}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(request.id)}
                      >
                        <DIcons.Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of{' '}
          {filteredRequests.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <DIcons.ChevronLeft className="w-4 h-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <DIcons.ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 