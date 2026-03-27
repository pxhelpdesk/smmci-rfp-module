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
import type { RfpCategory } from '@/types';
import { usePermission } from '@/hooks/use-permission';

type CategoryWithCount = RfpCategory & { usages_count: number };

type Props = {
    categories: CategoryWithCount[];
};

export default function Index({ categories }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const { can } = usePermission();

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/categories/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const columns: ColumnDef<CategoryWithCount>[] = [
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
            accessorKey: 'usages_count',
            header: 'Usages',
            size: 100,
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.usages_count}</Badge>
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
                const category = row.original;
                return (
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/rfp/categories/${category.id}`} className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                <Eye className="h-4 w-4" />
                                <span className="text-[10px] leading-none">View</span>
                            </Link>
                        </Button>
                        {can('rfp-category-edit') && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/rfp/categories/${category.id}/edit`} className="flex flex-col items-center gap-1 h-auto py-1 w-14">
                                    <Edit className="h-4 w-4" />
                                    <span className="text-[10px] leading-none">Edit</span>
                                </Link>
                            </Button>
                        )}
                        {can('rfp-category-delete') && (
                            <Button variant="ghost" size="sm"
                                onClick={() => setDeleteId(category.id)}
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
                { title: 'Categories', href: '/rfp/categories' },
            ]}
        >
            <Head title="RFP Categories" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">RFP Categories</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage expense categories
                        </p>
                    </div>
                    {can('rfp-category-create') && (
                        <Button size="sm" asChild>
                            <Link href="/rfp/categories/create">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Category
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={categories}
                    exportFileName="rfp-categories"
                    storageKey="rfp-categories"
                />
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this category? This action cannot be undone.
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
