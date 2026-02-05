import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, FileCheck, Trash2, Users, Activity, Printer } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RfpPdfDocument } from '@/components/rfp/rfp-pdf-document';
import type { RfpRequest } from '@/types';
import { toast } from 'sonner';

type Props = {
    rfp_request: RfpRequest;
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

export default function Show({ rfp_request }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '₱0.00';
        const currency = rfp_request.currency?.code || 'PHP';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency === 'PHP' ? 'PHP' : currency === 'USD' ? 'USD' : 'PHP',
        }).format(amount);
    };

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
                        <h1 className="text-2xl font-semibold">{rfp_request.rfp_request_number}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {rfp_request.usage?.description}
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
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/rfp/requests/${rfp_request.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteOpen(true)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={statusColors[rfp_request.status]}>
                        {statusLabels[rfp_request.status]}
                    </Badge>
                    <Badge variant="outline">{rfp_request.area}</Badge>
                </div>

                <Tabs defaultValue="details">
                    <TabsList variant="line">
                        <TabsTrigger value="details">
                            <FileCheck className="h-4 w-4" />
                            Details
                        </TabsTrigger>
                        <TabsTrigger value="signers">
                            <Users className="h-4 w-4" />
                            Signers
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <Activity className="h-4 w-4" />
                            Activity Logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5">
                                    <div>
                                        <p className="text-xs text-muted-foreground">RFP Number</p>
                                        <p className="text-sm font-medium">{rfp_request.rfp_request_number}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Area</p>
                                        <p className="text-sm">{rfp_request.area}</p>
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
                                        <p className="text-sm font-medium">{rfp_request.payee_type}</p>
                                    </div>
                                    <Separator />
                                    {rfp_request.payee_type === 'Supplier' ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Supplier Code</p>
                                                <p className="text-sm">{rfp_request.supplier_code || 'N/A'}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Supplier Name</p>
                                                <p className="text-sm">{rfp_request.supplier_name || 'N/A'}</p>
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
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Document Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">AP Number</p>
                                        <p className="text-sm font-medium">{rfp_request.ap_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Due Date</p>
                                        <p className="text-sm font-medium">{formatDate(rfp_request.due_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">RR Number</p>
                                        <p className="text-sm font-medium">{rfp_request.rr_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">PO Number</p>
                                        <p className="text-sm font-medium">{rfp_request.po_no || 'N/A'}</p>
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
                                                            {formatCurrency(detail.total_amount)}
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
                                    <CardTitle className="text-base">Financial Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5">
                                    <div className="flex justify-between">
                                        <p className="text-sm text-muted-foreground">Currency</p>
                                        <p className="text-sm font-medium">
                                            {rfp_request.currency?.code} - {rfp_request.currency?.name}
                                        </p>
                                    </div>
                                    {/* <Separator />
                                    <div className="flex justify-between">
                                        <p className="text-sm text-muted-foreground">Total Before VAT</p>
                                        <p className="text-sm font-medium">
                                            {formatCurrency(rfp_request.total_before_vat_amount)}
                                        </p>
                                    </div>
                                    {rfp_request.is_vatable && (
                                        <>
                                            <Separator />
                                            <div className="flex justify-between">
                                                <p className="text-sm text-muted-foreground">
                                                    VAT ({rfp_request.vat_type})
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {formatCurrency(rfp_request.vat_amount)}
                                                </p>
                                            </div>
                                        </>
                                    )} */}
                                    {/* {rfp_request.wtax_amount && Number(rfp_request.wtax_amount) > 0 && (
                                        <> */}
                                            <Separator />
                                            <div className="flex justify-between">
                                                <p className="text-sm text-muted-foreground">Less: Down Payment</p>
                                                <p className="text-sm font-medium text-destructive">
                                                    -{formatCurrency(rfp_request.less_down_payment_amount)}
                                                </p>
                                            </div>
                                        {/* </>
                                    )} */}
                                    {/* {rfp_request.less_down_payment_amount && Number(rfp_request.less_down_payment_amount) > 0 && (
                                        <> */}
                                            <Separator />
                                            <div className="flex justify-between">
                                                <p className="text-sm text-muted-foreground">Withholding Tax</p>
                                                <p className="text-sm font-medium">
                                                    {formatCurrency(rfp_request.wtax_amount)}
                                                </p>
                                            </div>
                                        {/* </>
                                    )} */}
                                    <Separator />
                                    <div className="flex justify-between">
                                        <p className="text-sm font-semibold">Grand Total</p>
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(rfp_request.grand_total_amount)}
                                        </p>
                                    </div>
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

                        {rfp_request.remarks && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Remarks</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{rfp_request.remarks}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="signers" className="mt-4">
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

                    <TabsContent value="logs" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Activity History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>From</TableHead>
                                                <TableHead>To</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!rfp_request.logs || rfp_request.logs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                        No activity logs found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rfp_request.logs.map((log) => (
                                                    <TableRow key={log.id}>
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
                                                        <TableCell>{log.details || 'N/A'}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {log.remarks || 'N/A'}
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
