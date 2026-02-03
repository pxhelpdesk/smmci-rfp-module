import { Link, router } from '@inertiajs/react';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import type { Rfp } from '@/types';

type Props = {
    rfps: {
        data: Rfp[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
    Final: 'bg-blue-100 text-blue-800',
    'Final with CV': 'bg-purple-100 text-purple-800',
    Paid: 'bg-green-100 text-green-800',
};

export default function Index({ rfps }: Props) {
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/requests/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const filteredRfps = rfps.data.filter(
        (rfp) =>
            rfp.rfp_number.toLowerCase().includes(search.toLowerCase()) ||
            rfp.rfp_form?.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'RFP Requests', href: '/rfp/requests' },
            ]}
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">RFP Requests</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage request for payment documents
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/rfp/requests/create">
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Request
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by RFP number or form..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>
                </div>

                <div className="border rounded-lg bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[130px]">RFP Number</TableHead>
                                <TableHead>Form</TableHead>
                                <TableHead>Payee</TableHead>
                                <TableHead>Area</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRfps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No RFP requests found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRfps.map((rfp) => (
                                    <TableRow key={rfp.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/rfp/requests/${rfp.id}/edit`}
                                                className="hover:underline text-primary"
                                            >
                                                {rfp.rfp_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px]">
                                                <p className="text-xs text-muted-foreground">
                                                    {rfp.rfp_form?.code}
                                                </p>
                                                <p className="text-sm truncate">
                                                    {rfp.rfp_form?.description}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm">{rfp.payee_type}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {rfp.payee_card_code}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{rfp.area}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <div className="text-sm">
                                                {new Intl.NumberFormat('en-PH', {
                                                    style: 'currency',
                                                    currency: rfp.currency === 'Peso' ? 'PHP' : 'USD',
                                                }).format(Number(rfp.grand_total || 0))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[rfp.status]}
                                            >
                                                {rfp.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(rfp.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Link href={`/rfp/requests/${rfp.id}/edit`}>
                                                        <FileText className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(rfp.id)}
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {rfps.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                        <p>
                            Showing {(rfps.current_page - 1) * rfps.per_page + 1} to{' '}
                            {Math.min(rfps.current_page * rfps.per_page, rfps.total)} of{' '}
                            {rfps.total} results
                        </p>
                        <div className="flex gap-1">
                            {Array.from({ length: rfps.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === rfps.current_page ? 'default' : 'ghost'}
                                    size="sm"
                                    asChild
                                    className="h-8 w-8 p-0"
                                >
                                    <Link href={`/rfp/requests?page=${page}`}>{page}</Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the RFP
                            request and all associated items.
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
        </AppLayout>
    );
}
