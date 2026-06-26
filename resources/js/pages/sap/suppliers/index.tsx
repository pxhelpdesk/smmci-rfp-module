import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { SapSupplier } from '@/types';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Props = {
    suppliers: SapSupplier[];
};

export default function Index({ suppliers }: Props) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncStatus(null);

        try {
            const res = await fetch('/rfp/sap/suppliers/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
            });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || 'Failed to sync suppliers from SAP.');
            }

            setSyncStatus({ type: 'success', message: json.message ?? 'Suppliers synced successfully.' });
            router.reload({ only: ['suppliers'] });
        } catch (error: any) {
            console.error('Failed to sync suppliers', error);
            setSyncStatus({
                type: 'error',
                message: error?.message || 'Failed to sync suppliers from SAP.',
            });
        } finally {
            setIsSyncing(false);
            // auto-dismiss after a few seconds
            setTimeout(() => setSyncStatus(null), 5000);
        }
    };

    const columns: ColumnDef<SapSupplier>[] = [
        { accessorKey: 'card_code', header: 'Supplier Code', size: 150 },
        { accessorKey: 'card_name', header: 'Supplier Name', size: 220 },
        {
            accessorKey: 'address',
            header: 'Address',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.address || 'N/A'}
                </span>
            ),
        },
        {
            accessorKey: 'tin',
            header: 'TIN',
            size: 150,
            cell: ({ row }) => <span className="text-sm">{row.original.tin || 'N/A'}</span>,
        },
        {
            accessorKey: 'last_synced_at',
            header: 'Last Synced',
            size: 180,
            accessorFn: (row) => row.last_synced_at ?? 'Never',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.last_synced_at
                        ? formatDateTime(row.original.last_synced_at, { dateFormat: 'short' })
                        : 'Never'}
                </span>
            ),
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/rfp/dashboard' },
                { title: 'Suppliers', href: '/rfp/sap/suppliers' },
            ]}
        >
            <Head title="Suppliers" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Suppliers</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            SAP suppliers synced from OCRD table
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                        <RefreshCw className={cn('h-4 w-4 mr-1.5', isSyncing && 'animate-spin')} />
                        {isSyncing ? 'Syncing...' : 'Refresh'}
                    </Button>
                </div>

                {syncStatus && (
                    <div
                        className={cn(
                            'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                            syncStatus.type === 'success'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-destructive/30 bg-destructive/10 text-destructive'
                        )}
                    >
                        {syncStatus.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{syncStatus.message}</span>
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={suppliers}
                    exportFileName="sap-suppliers"
                    storageKey="sap-suppliers"
                />
            </div>
        </AppLayout>
    );
}
