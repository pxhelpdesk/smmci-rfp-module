import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, FileCheck, Trash2, Users, Activity, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-custom';
import { RfpPdfDocument } from '@/components/rfp/rfp-pdf-document';
import type { RfpRequest, RfpLog } from '@/types';
import { toast } from 'sonner';
import { formatDate, formatDateTime, formatAmount } from '@/lib/formatters';
import { usePermission } from '@/hooks/use-permission';
import { RfpBadge } from '@/components/rfp/rfp-badge';

type Props = {
    rfp_request: RfpRequest;
    logs: {
        data: RfpLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export default function Show({ rfp_request, logs }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const [expandedLogIds, setExpandedLogIds] = useState<Set<number>>(new Set());

    const handleDelete = () => {
        router.delete(`/rfp/requests/${rfp_request.id}`, {
            onSuccess: () => {
                router.visit('/rfp/requests');
            },
        });
    };

    const handlePrint = async () => {
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

            toast.success('PDF ready', { id: 'print-toast' });

            // Reload to show updated print info
            setTimeout(() => router.reload({ only: ['rfp_request'] }), 1000);
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
    };

    const toggleLogExpand = (logId: number) => {
        setExpandedLogIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    const parseLogDetails = (details: string | null) => {
        if (!details) return null;
        try {
            return JSON.parse(details);
        } catch {
            return null;
        }
    };

    const renderLogsPaginationItems = () => {
        const items = [];
        const currentPage = logs.current_page;
        const lastPage = logs.last_page;

        // Always show first page
        items.push(
            <PaginationItem key={1}>
                <PaginationLink
                    href={`/rfp/requests/${rfp_request.id}?logs_page=1#logs`}
                    isActive={currentPage === 1}
                >
                    1
                </PaginationLink>
            </PaginationItem>
        );

        // Show ellipsis if needed
        if (currentPage > 3) {
            items.push(<PaginationEllipsis key="ellipsis-start" />);
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        href={`/rfp/requests/${rfp_request.id}?logs_page=${i}#logs`}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // Show ellipsis if needed
        if (currentPage < lastPage - 2) {
            items.push(<PaginationEllipsis key="ellipsis-end" />);
        }

        // Always show last page if there's more than 1 page
        if (lastPage > 1) {
            items.push(
                <PaginationItem key={lastPage}>
                    <PaginationLink
                        href={`/rfp/requests/${rfp_request.id}?logs_page=${lastPage}#logs`}
                        isActive={currentPage === lastPage}
                    >
                        {lastPage}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    const { can } = usePermission();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Requests', href: '/rfp/requests' },
                { title: rfp_request.rfp_request_number, href: `/rfp/requests/${rfp_request.id}` },
            ]}
        >
            <Head title={rfp_request.rfp_request_number} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">View RFP Request</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {rfp_request.rfp_request_number}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/rfp/requests">
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print
                        </Button>
                        {can('rfp-request-edit') && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/rfp/requests/${rfp_request.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        {can('rfp-request-delete') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteOpen(true)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="request">
                    <TabsList variant="line">
                        <TabsTrigger value="request">
                            <FileCheck className="h-4 w-4" />
                            Request
                        </TabsTrigger>
                        <TabsTrigger value="signatories">
                            <Users className="h-4 w-4" />
                            Signatories
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <Activity className="h-4 w-4" />
                            Logs
                        </TabsTrigger>
                    </TabsList>

                    {/* Requestor Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Requestor Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Prepared By</p>
                                    <p className="text-sm font-medium">{rfp_request.prepared_by?.name ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Department</p>
                                    <p className="text-sm">{rfp_request.prepared_by?.department?.department ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <p className="text-sm">
                                        <RfpBadge type="status" value={rfp_request.status} />
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <TabsContent value="request" className="space-y-4 mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5">
                                    <div>
                                        <p className="text-xs text-muted-foreground">RFP No.</p>
                                        <p className="text-sm font-medium">{rfp_request.rfp_request_number}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Area</p>
                                        <p className="text-sm">
                                            <RfpBadge type="area" value={rfp_request.area} />
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Category</p>
                                        <p className="text-sm">
                                            {rfp_request.usage?.category?.code} - {rfp_request.usage?.category?.name}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Usage</p>
                                        <p className="text-sm">
                                            {rfp_request.usage?.code} - {rfp_request.usage?.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Payee Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Type</p>
                                        <p className="text-sm font-medium">
                                            <RfpBadge type="payee" value={rfp_request.payee_type} />
                                        </p>
                                    </div>
                                    <Separator />
                                    {rfp_request.payee_type === 'supplier' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Supplier Code</p>
                                                    <p className="text-sm">{rfp_request.supplier_code || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Supplier Name</p>
                                                    <p className="text-sm">{rfp_request.supplier_name || 'N/A'}</p>
                                                </div>
                                            </div>
                                            {rfp_request.vendor_ref && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Vendor Reference</p>
                                                        <p className="text-sm">{rfp_request.vendor_ref}</p>
                                                    </div>
                                                </>
                                            )}
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Currency</p>
                                                <p className="text-sm">
                                                    {rfp_request.currency?.code} - {rfp_request.currency?.name}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Employee Code</p>
                                                <p className="text-sm">{rfp_request.employee_code || 'N/A'}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Employee Name</p>
                                                <p className="text-sm">{rfp_request.employee_name || 'N/A'}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Currency</p>
                                                <p className="text-sm">
                                                    {rfp_request.currency?.code} - {rfp_request.currency?.name}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Document Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">AP No.</p>
                                        <p className="text-sm font-medium">{rfp_request.ap_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Prepared Date - Due Date</p>
                                        <p className="text-sm font-medium">
                                            {formatDate(rfp_request.created_at)} – {formatDate(rfp_request.due_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">RR No.</p>
                                        <p className="text-sm font-medium">{rfp_request.rr_no || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">PO No.</p>
                                        <p className="text-sm font-medium">{rfp_request.po_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Requisition No.</p>
                                        <p className="text-sm font-medium">{rfp_request.requisition_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Contract No.</p>
                                        <p className="text-sm font-medium">{rfp_request.contract_no || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {/* <TableHead>Account Code</TableHead>
                                                <TableHead>Account Name</TableHead> */}
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rfp_request.details.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                        No details found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rfp_request.details.map((detail) => (
                                                    <TableRow key={detail.id}>
                                                        {/* <TableCell className="font-medium">
                                                            {detail.account_code || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{detail.account_name || 'N/A'}</TableCell> */}
                                                        <TableCell>{detail.description || 'N/A'}</TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatAmount(Number(detail.total_amount))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Remarks</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{rfp_request.remarks || 'N/A'}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Timestamps</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Created</p>
                                        <p className="text-sm">{formatDateTime(rfp_request.created_at)}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Last Updated</p>
                                        <p className="text-sm">{formatDateTime(rfp_request.updated_at)}</p>
                                    </div>
                                    {rfp_request.pdf_generated_at && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">PDF Generated Count</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Generated {rfp_request.pdf_generation_count} {rfp_request.pdf_generation_count === 1 ? 'time' : 'times'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="signatories" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Signatories</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date Signed</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!rfp_request.signs || rfp_request.signs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                        No signatories found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rfp_request.signs.map((sign) => (
                                                    <TableRow key={sign.id}>
                                                        <TableCell className="font-medium">
                                                            {sign.user?.name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {sign.user?.department?.department || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={sign.is_signed ? "default" : "secondary"}>
                                                                {sign.is_signed ? 'Signed' : 'Pending'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {sign.updated_at ? formatDateTime(sign.updated_at) : 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {sign.remarks || 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="logs" className="mt-4" id="logs">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Activity History</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12.5"></TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>From</TableHead>
                                                <TableHead>To</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!logs.data || logs.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                        No logs found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                logs.data.map((log) => {
                                                    const parsedDetails = parseLogDetails(log.details);
                                                    const isExpanded = expandedLogIds.has(log.id);
                                                    const hasDetails = parsedDetails && Array.isArray(parsedDetails) && parsedDetails.length > 0;

                                                    return (
                                                        <>
                                                            <TableRow key={log.id}>
                                                                <TableCell>
                                                                    {hasDetails && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                            onClick={() => toggleLogExpand(log.id)}
                                                                        >
                                                                            {isExpanded ? (
                                                                                <ChevronDown className="h-4 w-4" />
                                                                            ) : (
                                                                                <ChevronRight className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    {log.user?.name || 'System'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {log.from ? (
                                                                        <Badge variant="outline">{log.from}</Badge>
                                                                    ) : 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {log.into ? (
                                                                        <Badge variant="outline">{log.into}</Badge>
                                                                    ) : 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatDateTime(log.created_at)}
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">
                                                                    {log.remarks || 'N/A'}
                                                                </TableCell>
                                                            </TableRow>
                                                            {isExpanded && hasDetails && (
                                                                <TableRow>
                                                                    <TableCell colSpan={6} className="bg-muted/50 p-0">
                                                                        <div className="px-12 py-3">
                                                                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                                                                Changes:
                                                                            </p>
                                                                            <div className="border rounded-md bg-background">
                                                                                <table className="w-full text-xs">
                                                                                    <thead className="bg-muted/50">
                                                                                        <tr>
                                                                                            <th className="px-3 py-2 text-left font-medium w-[25%]">Field</th>
                                                                                            <th className="px-3 py-2 text-left font-medium w-[37.5%]">Old Value</th>
                                                                                            <th className="px-3 py-2 text-left font-medium w-[37.5%]">New Value</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {parsedDetails.map((change: any, idx: number) => (
                                                                                            <tr key={idx} className="border-t">
                                                                                                <td className="px-3 py-2 font-medium">
                                                                                                    {change.field}
                                                                                                </td>
                                                                                                <td className="px-3 py-2 text-muted-foreground wrap-break-word">
                                                                                                    {change.old}
                                                                                                </td>
                                                                                                <td className="px-3 py-2 text-primary wrap-break-word">
                                                                                                    {change.new}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {logs.last_page > 1 && (
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={logs.current_page > 1 ? `/rfp/requests/${rfp_request.id}?logs_page=${logs.current_page - 1}#logs` : '#'}
                                                    className={logs.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>

                                            {renderLogsPaginationItems()}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href={logs.current_page < logs.last_page ? `/rfp/requests/${rfp_request.id}?logs_page=${logs.current_page + 1}#logs` : '#'}
                                                    className={logs.current_page === logs.last_page ? 'pointer-events-none opacity-50' : ''}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {rfp_request.rfp_request_number}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
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
                            {rfp_request.rfp_request_number}
                        </DialogTitle>
                    </DialogHeader>
                    {previewPdf && (
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={previewPdf}
                                className="w-full h-full border-0"
                                title={rfp_request.rfp_request_number}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
