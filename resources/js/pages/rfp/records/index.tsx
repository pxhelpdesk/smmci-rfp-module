import { Link, router, Head } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2, Printer, Ban, AlertTriangle, Eye } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
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
import type { RfpRecord } from '@/types';
import { formatDate, formatTime } from '@/lib/formatters';
import { usePermission } from '@/hooks/use-permission';
import { RfpBadge } from '@/components/rfp/rfp-display';
import { RfpPdfPreviewDialog } from '@/components/rfp/rfp-pdf-preview-dialog';

type Props = {
    rfp_records: RfpRecord[];
};

export default function Index({ rfp_records }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [cancelId, setCancelId] = useState<number | null>(null);
    const [previewRfp, setPreviewRfp] = useState<RfpRecord | null>(null);
    const { can } = usePermission();

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/records/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const handleCancel = () => {
        if (cancelId) {
            router.patch(`/rfp/records/${cancelId}/cancel`, {}, {
                onSuccess: () => setCancelId(null),
            });
        }
    };

    const columns: ColumnDef<RfpRecord>[] = [
        {
            accessorKey: 'rfp_number',
            header: 'RFP No.',
            size: 150,
            cell: ({ row }) => {
                const rfp = row.original;
                // const isOverdue = rfp.status === 'draft' &&
                //     new Date(rfp.due_date) < new Date(new Date().toDateString());
                return (
                    <div className="flex items-center gap-2">
                        <Link href={`/rfp/records/${rfp.id}`} className="hover:underline text-primary font-medium">
                            {rfp.rfp_number}
                        </Link>
                        {/* {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                            </span>
                        )} */}
                    </div>
                );
            },
        },
        {
            accessorKey: 'office',
            header: 'Office',
            size: 120,
            accessorFn: (row) => row.office === 'head_office' ? 'Head Office' : 'Mine Site',
            cell: ({ row }) => <RfpBadge type="office" value={row.original.office} />,
        },
        {
            accessorKey: 'prepared_by',
            header: 'Requestor',
            size: 160,
            accessorFn: (row) => row.prepared_by?.name ?? '',
            cell: ({ row }) => (
                <div>
                    <p className="text-sm">{row.original.prepared_by?.name ?? 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.prepared_by?.department?.department ?? ''}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'payee_type',
            header: 'Payee',
            size: 140,
            cell: ({ row }) => {
                const rfp = row.original;
                return (
                    <div>
                        <RfpBadge type="payee" value={rfp.payee_type} />
                        <p className="text-xs text-muted-foreground">
                            {rfp.payee_type === 'supplier' ? rfp.supplier_code : rfp.employee_code}
                        </p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Prepared',
            size: 130,
            accessorFn: (row) => formatDate(row.created_at),
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    <div>{formatDate(row.original.created_at)}</div>
                    <div className="text-xs">{formatTime(row.original.created_at)}</div>
                </div>
            ),
        },
        {
            accessorKey: 'due_date',
            header: 'Due Date',
            size: 120,
            accessorFn: (row) => formatDate(row.due_date),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {formatDate(row.original.due_date)}
                </span>
            ),
        },
        {
            accessorKey: 'currency',
            header: 'Currency',
            size: 100,
            accessorFn: (row) => row.currency?.code ?? 'PHP',
            cell: ({ row }) => (
                <span className="text-sm font-medium">
                    {row.original.currency?.code ?? 'PHP'}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            size: 120,
            accessorFn: (row) => row.status,
            cell: ({ row }) => <RfpBadge type="status" value={row.original.status} />,
        },
        {
            accessorKey: 'updated_at',
            header: 'Updated',
            size: 130,
            accessorFn: (row) => formatDate(row.updated_at),
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    <div>{formatDate(row.original.updated_at)}</div>
                    <div className="text-xs">{formatTime(row.original.updated_at)}</div>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            enableColumnFilter: false,
            size: 160,
            cell: ({ row }) => {
                const rfp = row.original;
                return (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/rfp/records/${rfp.id}`} className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <Eye className="h-4 w-4" />
                                <span className="text-[10px] leading-none">View</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm"
                            onClick={() => setPreviewRfp(rfp)}
                            className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                            <Printer className="h-4 w-4" />
                            <span className="text-[10px] leading-none">Print</span>
                        </Button>
                        {can('rfp-record-edit') && rfp.status !== 'cancelled' && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/rfp/records/${rfp.id}/edit`} className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                    <Pencil className="h-4 w-4" />
                                    <span className="text-[10px] leading-none">Edit</span>
                                </Link>
                            </Button>
                        )}
                        {can('rfp-record-cancel') && rfp.status !== 'cancelled' && (
                            <Button variant="ghost" size="sm"
                                onClick={() => setCancelId(rfp.id)}
                                className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <Ban className="h-4 w-4 text-orange-600" />
                                <span className="text-[10px] leading-none">Cancel</span>
                            </Button>
                        )}
                        {can('rfp-record-delete') && (
                            <Button variant="ghost" size="sm"
                                onClick={() => setDeleteId(rfp.id)}
                                className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="text-[10px] leading-none">Delete</span>
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/rfp/dashboard' },
                { title: 'Records', href: '/rfp/records' },
            ]}
        >
            <Head title="RFP Records" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Records</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage records for RFP
                        </p>
                    </div>
                    {can('rfp-record-create') && (
                        <Button asChild size="sm">
                            <Link href="/rfp/records/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                New Record
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={rfp_records}
                    exportFileName="rfp-records"
                    storageKey="rfp-records"
                    initialColumnVisibility={{ updated_at: false }}
                />
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the RFP record and all associated details.
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

            <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel RFP</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this RFP? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-orange-600 text-white hover:bg-orange-700">
                            Cancel RFP
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <RfpPdfPreviewDialog
                rfp_record={previewRfp}
                open={!!previewRfp}
                onClose={() => setPreviewRfp(null)}
            />
        </AppLayout>
    );
}
