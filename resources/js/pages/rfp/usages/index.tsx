import { router, Head, Link } from '@inertiajs/react';
import { Edit, Plus, Trash2, Eye, Filter } from 'lucide-react';
import { useState } from 'react';
import Select from 'react-select';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent } from '@/components/ui/card';
import type { RfpUsage, RfpCategory } from '@/types';

type Props = {
    usages: {
        data: RfpUsage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: RfpCategory[];
};

export default function Index({ usages, categories }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/usages/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const handleFilter = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        if (categoryId) {
            router.get(`/rfp/usages?category_id=${categoryId}`);
        } else {
            router.get('/rfp/usages');
        }
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`,
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Usages', href: '/rfp/usages' },
            ]}
        >
            <Head title="RFP Usages" />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">RFP Usages</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage expense usage descriptions
                        </p>
                    </div>
                    <Button size="sm" asChild>
                        <Link href="/rfp/usages/create">
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Usage
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <div className="relative flex-1 max-w-sm">
                        <Select
                            options={categoryOptions}
                            value={categoryOptions.find(o => o.value === selectedCategory)}
                            onChange={(opt) => handleFilter(opt?.value || null)}
                            isClearable
                            placeholder="Filter by category..."
                            className="text-sm"
                            styles={{
                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                menu: (base) => ({ ...base, fontSize: '14px' }),
                            }}
                        />
                    </div>
                </div>

                <div className="border rounded-lg bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usages.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No usages found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                usages.data.map((usage) => (
                                    <TableRow key={usage.id}>
                                        <TableCell className="font-medium">{usage.code}</TableCell>
                                        <TableCell>
                                            {usage.category ? (
                                                <Badge variant="outline">
                                                    {usage.category.name}
                                                </Badge>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>{usage.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={usage.is_active ? "default" : "secondary"}>
                                                {usage.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/rfp/usages/${usage.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/rfp/usages/${usage.id}/edit`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(usage.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Usage</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this usage? This action cannot be undone.
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
