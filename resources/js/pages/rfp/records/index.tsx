import { Link, router, Head } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2, Printer, Ban, AlertTriangle, Eye, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { RfpRecord } from '@/types';
import { formatDate, formatTime } from '@/lib/formatters';
import { usePermission } from '@/hooks/use-permission';
import { RfpBadge } from '@/components/rfp/rfp-display';
import { RfpPdfPreviewDialog } from '@/components/rfp/rfp-pdf-preview-dialog';
import { RfpActionDialogs, type RfpActionType } from '@/components/rfp/rfp-action-dialogs';

type Props = {
    rfp_records: RfpRecord[];
};

export default function Index({ rfp_records }: Props) {
    const [activeAction, setActiveAction] = useState<{ type: RfpActionType; id: number } | null>(null);
    const [previewRfp, setPreviewRfp] = useState<RfpRecord | null>(null);
    const { can } = usePermission();

    const handleAction = (action: Exclude<RfpActionType, null>, remarks: string) => {
        if (!activeAction) return;
        if (action === 'delete') {
            router.delete(`/rfp/records/${activeAction.id}`, {
                data: { remarks },
                onSuccess: () => setActiveAction(null),
            });
        } else if (action === 'cancel') {
            router.patch(`/rfp/records/${activeAction.id}/cancel`, { remarks }, {
                onSuccess: () => setActiveAction(null),
            });
        } else if (action === 'revert') {
            router.patch(`/rfp/records/${activeAction.id}/revert`, { remarks }, {
                onSuccess: () => setActiveAction(null),
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
                return (
                    <div className="flex items-center gap-2">
                        <Link href={`/rfp/records/${rfp.id}`} className="hover:underline text-primary font-medium">
                            {rfp.rfp_number}
                        </Link>
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
                                onClick={() => setActiveAction({ type: 'cancel', id: rfp.id })}
                                className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <Ban className="h-4 w-4 text-orange-600" />
                                <span className="text-[10px] leading-none">Cancel</span>
                            </Button>
                        )}
                        {can('rfp-record-revert') && (rfp.status === 'paid' || rfp.status === 'cancelled') && (
                            <Button variant="ghost" size="sm"
                                onClick={() => setActiveAction({ type: 'revert', id: rfp.id })}
                                className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <RotateCcw className="h-4 w-4 text-yellow-600" />
                                <span className="text-[10px] leading-none">Revert</span>
                            </Button>
                        )}
                        {can('rfp-record-delete') && (
                            <Button variant="ghost" size="sm"
                                onClick={() => setActiveAction({ type: 'delete', id: rfp.id })}
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

            <RfpActionDialogs
                rfpNumber={rfp_records.find(r => r.id === activeAction?.id)?.rfp_number ?? ''}
                activeAction={activeAction?.type ?? null}
                onClose={() => setActiveAction(null)}
                onConfirm={handleAction}
            />

            <RfpPdfPreviewDialog
                rfp_record={previewRfp}
                open={!!previewRfp}
                onClose={() => setPreviewRfp(null)}
            />
        </AppLayout>
    );
}
