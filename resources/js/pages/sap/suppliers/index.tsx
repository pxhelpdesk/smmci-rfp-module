import { Head } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { SapSupplier } from '@/types';
import { formatDateTime } from '@/lib/formatters';

type Props = {
    suppliers: SapSupplier[];
};

export default function Index({ suppliers }: Props) {
    const columns: ColumnDef<SapSupplier>[] = [
        {
            accessorKey: 'card_code',
            header: 'Supplier Code',
            size: 150,
        },
        {
            accessorKey: 'card_name',
            header: 'Supplier Name',
            size: 220,
        },
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
            cell: ({ row }) => (
                <span className="text-sm">{row.original.tin || 'N/A'}</span>
            ),
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
                    <Button variant="outline" size="sm" asChild>
                        <a href="/rfp/sap/suppliers">
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Refresh
                        </a>
                    </Button>
                </div>

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
