import { Link, router, Head } from '@inertiajs/react';
import { CheckCircle2, Clock, Edit, FileText, Printer, Trash2, FileCheck, Users, Activity } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { TabsCustom } from '@/components/ui/tabs-custom';
import type { Rfp } from '@/types';

type Props = {
    rfp: Rfp;
};

const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
    Final: 'bg-blue-100 text-blue-800',
    'Final with CV': 'bg-purple-100 text-purple-800',
    Paid: 'bg-green-100 text-green-800',
};

export default function Show({ rfp }: Props) {
    const [showDelete, setShowDelete] = useState(false);

    const handleDelete = () => {
        router.delete(`/rfp/requests/${rfp.id}`, {
            onSuccess: () => router.visit('/rfp/requests'),
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: rfp.currency === 'Peso' ? 'PHP' : 'USD',
        }).format(amount);
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

    const vatAmount = rfp.is_vatable ? (rfp.vat_type === 'Inclusive'
        ? (Number(rfp.total_before_vat || 0) * 0.12) / 1.12
        : Number(rfp.total_before_vat || 0) * 0.12) : 0;
    const grandTotal = Number(rfp.total_before_vat || 0)
        + (rfp.vat_type === 'Exclusive' ? vatAmount : 0)
        + Number(rfp.withholding_tax || 0)
        - Number(rfp.down_payment || 0);

    const tabs = [
        {
            id: 'details',
            label: 'Details',
            icon: <FileCheck className="h-4 w-4" />,
            content: (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Form Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5">
                                <div>
                                    <p className="text-xs text-muted-foreground">RFP Form</p>
                                    <p className="text-sm font-medium">
                                        {rfp.rfp_form ? `${rfp.rfp_form.code} - ${rfp.rfp_form.description}` : 'N/A'}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground">Shared Description</p>
                                    <p className="text-sm font-medium">
                                        {rfp.shared_description ? `${rfp.shared_description.code} - ${rfp.shared_description.description}` : 'N/A'}
                                    </p>
                                </div>
                                {rfp.purpose && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Purpose</p>
                                            <p className="text-sm">{rfp.purpose}</p>
                                        </div>
                                    </>
                                )}
                                {rfp.remarks && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Remarks</p>
                                            <p className="text-sm whitespace-pre-wrap">{rfp.remarks}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Payee Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5">
                                <div>
                                    <p className="text-xs text-muted-foreground">Supplier Code</p>
                                    <p className="text-sm font-medium">{rfp.payee_card_code || 'N/A'}</p>
                                </div>
                                {rfp.payee_card_name && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Supplier Name</p>
                                            <p className="text-sm font-medium">{rfp.payee_card_name}</p>
                                        </div>
                                    </>
                                )}
                                {rfp.payee_invoice_number && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Invoice Number</p>
                                            <p className="text-sm font-medium">{rfp.payee_invoice_number}</p>
                                        </div>
                                    </>
                                )}
                                {rfp.voucher_number && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Voucher Number</p>
                                            <p className="text-sm font-medium">{rfp.voucher_number}</p>
                                        </div>
                                    </>
                                )}
                                {rfp.check_number && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Check Number</p>
                                            <p className="text-sm font-medium">{rfp.check_number}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Account Code</TableHead>
                                            <TableHead>Account Name</TableHead>
                                            <TableHead>Payment Type</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rfp.items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                                    No items found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rfp.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.account_code || 'N/A'}</TableCell>
                                                    <TableCell>{item.account_name || 'N/A'}</TableCell>
                                                    <TableCell>{item.payment_type || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(Number(item.billed_amount || 0))}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2.5">
                                <div className="flex justify-between">
                                    <p className="text-sm text-muted-foreground">Currency</p>
                                    <p className="text-sm font-medium">{rfp.currency}</p>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <p className="text-sm text-muted-foreground">Total Before VAT</p>
                                    <p className="text-sm font-medium">{formatCurrency(Number(rfp.total_before_vat || 0))}</p>
                                </div>
                                {rfp.is_vatable && (
                                    <div className="flex justify-between">
                                        <p className="text-sm text-muted-foreground">VAT ({rfp.vat_type})</p>
                                        <p className="text-sm font-medium">{formatCurrency(vatAmount)}</p>
                                    </div>
                                )}
                                {rfp.withholding_tax && Number(rfp.withholding_tax) > 0 && (
                                    <div className="flex justify-between">
                                        <p className="text-sm text-muted-foreground">Withholding Tax</p>
                                        <p className="text-sm font-medium">{formatCurrency(Number(rfp.withholding_tax))}</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2.5">
                                {rfp.down_payment && Number(rfp.down_payment) > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <p className="text-sm text-muted-foreground">Down Payment</p>
                                            <p className="text-sm font-medium">-{formatCurrency(Number(rfp.down_payment))}</p>
                                        </div>
                                        <Separator />
                                    </>
                                )}
                                <div className="flex justify-between">
                                    <p className="text-sm text-muted-foreground">Created Date</p>
                                    <p className="text-sm font-medium">
                                        {new Date(rfp.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                {rfp.due_date && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <p className="text-sm text-muted-foreground">Due Date</p>
                                            <p className="text-sm font-medium">
                                                {new Date(rfp.due_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </>
                                )}
                                <Separator />
                                <div className="flex justify-between">
                                    <p className="text-sm font-semibold">Grand Total</p>
                                    <p className="text-sm font-semibold">{formatCurrency(grandTotal)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ),
        },
        {
            id: 'signers',
            label: 'Signers',
            icon: <Users className="h-4 w-4" />,
            content: (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Signature Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {rfp.signs && rfp.signs.length > 0 ? (
                                rfp.signs.map((sign) => (
                                    <div key={sign.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {/* {sign.is_signed ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-amber-600" />
                                            )} */}
                                            <div>
                                                <p className="text-sm font-medium">{sign.user_type}</p>
                                                {sign.user && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {sign.user.first_name} {sign.user.last_name}
                                                        {sign.user.department && ` - ${sign.user.department.department}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {/* <div className="text-right">
                                            <Badge variant={sign.is_signed ? "default" : "secondary"}>
                                                {sign.is_signed ? 'Signed' : 'Pending'}
                                            </Badge>
                                            {sign.is_signed && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDateTime(sign.created_at)}
                                                </p>
                                            )}
                                        </div> */}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No signers found
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ),
        },
        {
            id: 'logs',
            label: 'Activity Logs',
            icon: <Activity className="h-4 w-4" />,
            content: (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Activity History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {rfp.logs && rfp.logs.length > 0 ? (
                                rfp.logs.map((log) => (
                                    <div key={log.id} className="flex gap-3 p-3 border rounded-lg">
                                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">{log.details}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(log.created_at)}
                                                </p>
                                            </div>
                                            {log.user && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    By {log.user.first_name} {log.user.last_name}
                                                    {log.user.department && ` - ${log.user.department.department}`}
                                                </p>
                                            )}
                                            {(log.from || log.into) && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {log.from && (
                                                        <Badge variant="outline" className="text-xs">
                                                            From: {log.from}
                                                        </Badge>
                                                    )}
                                                    {log.into && (
                                                        <Badge variant="outline" className="text-xs">
                                                            To: {log.into}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No activity logs found
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ),
        },
    ];

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
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print
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
                            onClick={() => setShowDelete(true)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={statusColors[rfp.status]}>
                        {rfp.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{rfp.area}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{rfp.payee_type}</span>
                </div>

                <TabsCustom tabs={tabs} defaultTab="details" />
            </div>

            <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the RFP
                            request "{rfp.rfp_number}" and all associated items.
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
