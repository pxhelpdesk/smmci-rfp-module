import { router, Head, Link } from '@inertiajs/react';
import { Edit, Plus, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { RfpCurrency } from '@/types';
import { usePermission } from '@/hooks/use-permission';

type Props = {
    currencies: RfpCurrency[];
};

export default function Index({ currencies }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { can } = usePermission();

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/currencies/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const columns: ColumnDef<RfpCurrency>[] = [
        {
            accessorKey: 'code',
            header: 'Code',
            size: 120,
        },
        {
            accessorKey: 'name',
            header: 'Name',
            size: 180,
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.description || 'N/A'}
                </span>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            size: 120,
            accessorFn: (row) => row.is_active ? 'Active' : 'Inactive',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            enableColumnFilter: false,
            size: 120,
            cell: ({ row }) => {
                const currency = row.original;
                return (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/rfp/currencies/${currency.id}`} className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <Eye className="h-4 w-4" />
                                <span className="text-[10px] leading-none">View</span>
                            </Link>
                        </Button>
                        {can('rfp-currency-edit') && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/rfp/currencies/${currency.id}/edit`} className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                    <Edit className="h-4 w-4" />
                                    <span className="text-[10px] leading-none">Edit</span>
                                </Link>
                            </Button>
                        )}
                        {can('rfp-currency-delete') && (
                            <Button variant="ghost" size="sm"
                                onClick={() => setDeleteId(currency.id)}
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
                { title: 'Currencies', href: '/rfp/currencies' },
            ]}
        >
            <Head title="RFP Currencies" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">RFP Currencies</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage available currencies
                        </p>
                    </div>
                    {can('rfp-currency-create') && (
                        <Button size="sm" asChild>
                            <Link href="/rfp/currencies/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Currency
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={currencies}
                    exportFileName="rfp-currencies"
                    storageKey="rfp-currencies"
                />
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Currency</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this currency? This action cannot be undone.
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
