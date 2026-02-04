import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, FileCheck, Trash2, Users, Activity } from 'lucide-react';
import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Rfp } from '@/types';

type Props = {
    rfp: Rfp;
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

export default function Show({ rfp }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const handleDelete = () => {
        router.delete(`/rfp/requests/${rfp.id}`, {
            onSuccess: () => {
                router.visit('/rfp/requests');
            },
        });
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
        const currency = rfp.currency?.code || 'PHP';
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
                { title: rfp.rfp_number, href: `/rfp/requests/${rfp.id}` },
            ]}
        >
            <Head title={rfp.rfp_number} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{rfp.rfp_number}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {rfp.usage?.description}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/rfp/requests">
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/rfp/requests/${rfp.id}/edit`}>
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
                    <Badge variant="secondary" className={statusColors[rfp.status]}>
                        {statusLabels[rfp.status]}
                    </Badge>
                    <Badge variant="outline">{rfp.area}</Badge>
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
                                        <p className="text-sm font-medium">{rfp.rfp_number}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Area</p>
                                        <p className="text-sm">{rfp.area}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Category</p>
                                        <p className="text-sm">
                                            {rfp.usage?.category?.code} - {rfp.usage?.category?.name}
                                        </p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Usage</p>
                                        <p className="text-sm">
                                            {rfp.usage?.code} - {rfp.usage?.description}
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
                                        <p className="text-sm font-medium">{rfp.payee_type}</p>
                                    </div>
                                    <Separator />
                                    {rfp.payee_type === 'Supplier' ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Supplier Code</p>
                                                <p className="text-sm">{rfp.supplier_code || 'N/A'}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Supplier Name</p>
                                                <p className="text-sm">{rfp.supplier_name || 'N/A'}</p>
                                            </div>
                                            {rfp.vendor_ref && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Vendor Reference</p>
                                                        <p className="text-sm">{rfp.vendor_ref}</p>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Employee Code</p>
                                                <p className="text-sm">{rfp.employee_code || 'N/A'}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Employee Name</p>
                                                <p className="text-sm">{rfp.employee_name || 'N/A'}</p>
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
                                        <p className="text-sm font-medium">{rfp.ap_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Due Date</p>
                                        <p className="text-sm font-medium">{formatDate(rfp.due_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">RR Number</p>
                                        <p className="text-sm font-medium">{rfp.rr_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">PO Number</p>
                                        <p className="text-sm font-medium">{rfp.po_no || 'N/A'}</p>
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
                                            {rfp.details.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                        No details found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rfp.details.map((detail) => (
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
                                            {rfp.currency?.code} - {rfp.currency?.name}
                                        </p>
                                    </div>
                                    {/* <Separator />
                                    <div className="flex justify-between">
                                        <p className="text-sm text-muted-foreground">Total Before VAT</p>
                                        <p className="text-sm font-medium">
                                            {formatCurrency(rfp.total_before_vat_amount)}
                                        </p>
                                    </div>
                                    {rfp.is_vatable && (
                                        <>
                                            <Separator />
                                            <div className="flex justify-between">
                                                <p className="text-sm text-muted-foreground">
                                                    VAT ({rfp.vat_type})
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {formatCurrency(rfp.vat_amount)}
                                                </p>
                                            </div>
                                        </>
                                    )} */}
                                    {rfp.wtax_amount && Number(rfp.wtax_amount) > 0 && (
                                        <>
                                            <Separator />
                                            <div className="flex justify-between">
                                                <p className="text-sm text-muted-foreground">Withholding Tax</p>
                                                <p className="text-sm font-medium">
                                                    {formatCurrency(rfp.wtax_amount)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    {rfp.less_down_payment_amount && Number(rfp.less_down_payment_amount) > 0 && (
                                        <>
                                            <Separator />
                                            <div className="flex justify-between">
                                                <p className="text-sm text-muted-foreground">Less: Down Payment</p>
                                                <p className="text-sm font-medium text-destructive">
                                                    -{formatCurrency(rfp.less_down_payment_amount)}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between">
                                        <p className="text-sm font-semibold">Grand Total</p>
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(rfp.grand_total_amount)}
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
                                        <p className="text-sm">{formatDateTime(rfp.created_at)}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Last Updated</p>
                                        <p className="text-sm">{formatDateTime(rfp.updated_at)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {rfp.remarks && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Remarks</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{rfp.remarks}</p>
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
                                            {!rfp.signs || rfp.signs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                        No signatories found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rfp.signs.map((sign) => (
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
                                                <TableHead>Action</TableHead>
                                                <TableHead>From</TableHead>
                                                <TableHead>To</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!rfp.logs || rfp.logs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                        No activity logs found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rfp.logs.map((log) => (
                                                    <TableRow key={log.id}>
                                                        <TableCell className="font-medium">
                                                            {log.user?.name || 'System'}
                                                        </TableCell>
                                                        <TableCell>{log.details || 'N/A'}</TableCell>
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

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {rfp.rfp_number}? This action cannot be undone.
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
        </AppLayout>
    );
}
