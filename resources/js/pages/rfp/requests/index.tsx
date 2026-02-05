import { Link, router, Head } from '@inertiajs/react';
import { FileText, MoreVertical, Pencil, Plus, Search, Trash2, Printer } from 'lucide-react';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RfpPdfDocument } from '@/components/rfp/rfp-pdf-document';
import type { RfpRequest } from '@/types';

type Props = {
    rfp_requests: {
        data: RfpRequest[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

const statusColors = {
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    for_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
};

const statusLabels = {
    cancelled: 'Cancelled',
    draft: 'Draft',
    for_approval: 'For Approval',
    approved: 'Approved',
    paid: 'Paid',
};

export default function Index({ rfp_requests }: Props) {
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const [previewRfp, setPreviewRfp] = useState<RfpRequest | null>(null);

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/requests/${deleteId}`, {
                onSuccess: () => {
                    setDeleteId(null);
                },
                onError: () => {
                    toast.error('Failed to delete RFP request');
                },
            });
        }
    };

    const handlePrint = async (rfp_request: RfpRequest) => {
        toast.loading('Generating PDF...', { id: 'print-toast' });

        try {
            const blob = await pdf(<RfpPdfDocument rfp_request={rfp_request} />).toBlob();
            const url = URL.createObjectURL(blob);

            // Track PDF generation
            await fetch(`/rfp/requests/${rfp_request.id}/track-print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            setPreviewPdf(url);
            setPreviewRfp(rfp_request);

            toast.success('PDF ready', { id: 'print-toast' });
        } catch (error) {
            console.error('PDF generation failed:', error);
            toast.error('Failed to generate PDF', { id: 'print-toast' });
        }
    };

    const handleClosePdf = () => {
        if (previewPdf) {
            URL.revokeObjectURL(previewPdf);
        }
        setPreviewPdf(null);
        setPreviewRfp(null);
    };

    const filteredRfps = rfp_requests.data.filter(
        (rfp_request) =>
            rfp_request.rfp_request_number.toLowerCase().includes(search.toLowerCase()) ||
            rfp_request.usage?.description.toLowerCase().includes(search.toLowerCase()) ||
            rfp_request.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
            rfp_request.employee_name?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number | null, currencyCode: string) => {
        if (!amount) return '₱0.00';
        const currency = currencyCode === 'PHP' ? 'PHP' : currencyCode === 'USD' ? 'USD' : 'PHP';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Requests', href: '/rfp/requests' },
            ]}
        >
            <Head title="RFP Requests" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Requests</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage request for payment documents
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/rfp/requests/create">
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Request
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by RFP number, usage, or payee..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>
                </div>

                <div className="border rounded-lg bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[130px]">RFP Number</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Payee</TableHead>
                                <TableHead>Area</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRfps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No Requests found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRfps.map((rfp_request) => (
                                    <TableRow key={rfp_request.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/rfp/requests/${rfp_request.id}`}
                                                className="hover:underline text-primary"
                                            >
                                                {rfp_request.rfp_request_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px]">
                                                <p className="text-xs text-muted-foreground">
                                                    {rfp_request.usage?.code}
                                                </p>
                                                <p className="text-sm truncate">
                                                    {rfp_request.usage?.description}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm">{rfp_request.payee_type}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {rfp_request.payee_type === 'Supplier'
                                                        ? rfp_request.supplier_code
                                                        : rfp_request.employee_code}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{rfp_request.area}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(rfp_request.due_date)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <div className="text-sm">
                                                {formatCurrency(rfp_request.grand_total_amount, rfp_request.currency?.code || 'PHP')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[rfp_request.status]}
                                            >
                                                {statusLabels[rfp_request.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                <div>{formatDate(rfp_request.created_at)}</div>
                                                <div className="text-xs">
                                                    {new Date(rfp_request.created_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                <div>{formatDate(rfp_request.updated_at)}</div>
                                                <div className="text-xs">
                                                    {new Date(rfp_request.updated_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/rfp/requests/${rfp_request.id}`}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrint(rfp_request)}>
                                                        <Printer className="h-4 w-4 mr-2" />
                                                        Print
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/rfp/requests/${rfp_request.id}/edit`}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteId(rfp_request.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {rfp_requests.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                        <p>
                            Showing {(rfp_requests.current_page - 1) * rfp_requests.per_page + 1} to{' '}
                            {Math.min(rfp_requests.current_page * rfp_requests.per_page, rfp_requests.total)} of{' '}
                            {rfp_requests.total} results
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: rfp_requests.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === rfp_requests.current_page ? 'default' : 'ghost'}
                                    size="sm"
                                    asChild
                                    className="h-8 w-8 p-0"
                                >
                                    <Link href={`/rfp/requests?page=${page}`}>{page}</Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the RFP
                            request and all associated details.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* PDF Preview Dialog */}
            <Dialog open={!!previewPdf} onOpenChange={handleClosePdf}>
                <DialogContent
                    className="flex flex-col p-0 gap-0"
                    style={{
                        maxWidth: '90vw',
                        width: '90vw',
                        height: '95vh',
                        margin: 'auto'
                    }}
                >
                    <DialogHeader className="px-6 py-3 border-b shrink-0">
                        <DialogTitle className="text-lg">
                            {previewRfp?.rfp_request_number || 'PDF Preview'}
                        </DialogTitle>
                    </DialogHeader>
                    {previewPdf && (
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={previewPdf}
                                className="w-full h-full border-0"
                                title={previewRfp?.rfp_request_number || 'PDF Preview'}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
