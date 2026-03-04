// pages/rfp/records/index.tsx
import { Link, router, Head } from '@inertiajs/react';
import { FileText, MoreVertical, Pencil, Plus, Search, Trash2, Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import type { RfpRecord } from '@/types';
import { formatDate, formatTime } from '@/lib/formatters';
import { usePermission } from '@/hooks/use-permission';
import { RfpBadge } from '@/components/rfp/rfp-display';
import { RfpPdfPreviewDialog } from '@/components/rfp/rfp-pdf-preview-dialog';

type Props = {
    rfp_records: {
        data: RfpRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export default function Index({ rfp_records }: Props) {
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);

    const handleDelete = () => {
        if (deleteId) {
            router.delete(`/rfp/records/${deleteId}`, {
                onSuccess: () => {
                    setDeleteId(null);
                },
                onError: () => {
                    toast.error('Failed to delete RFP');
                },
            });
        }
    };

    const [previewRfp, setPreviewRfp] = useState<RfpRecord | null>(null);

    const handlePrint = (rfp_record: RfpRecord) => {
        setPreviewRfp(rfp_record);
    };

    const handleClosePdf = () => {
        setPreviewRfp(null);
    };

    const filteredRfps = rfp_records.data.filter(
        (rfp_record) =>
            rfp_record.rfp_number.toLowerCase().includes(search.toLowerCase()) ||
            rfp_record.usage?.description.toLowerCase().includes(search.toLowerCase()) ||
            rfp_record.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
            rfp_record.employee_name?.toLowerCase().includes(search.toLowerCase())
    );

    const { can } = usePermission();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
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

                <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by RFP number, usage, or payee..."
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
                                <TableHead className="w-32.5">RFP No.</TableHead>
                                <TableHead>Area</TableHead>
                                <TableHead>Requestor</TableHead>
                                <TableHead>Payee</TableHead>
                                <TableHead>Prepared</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="w-15"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRfps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No Records found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRfps.map((rfp_record) => (
                                    <TableRow key={rfp_record.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/rfp/records/${rfp_record.id}`}
                                                className="hover:underline text-primary"
                                            >
                                                {rfp_record.rfp_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <RfpBadge type="area" value={rfp_record.area} />
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm">{rfp_record.prepared_by?.name ?? 'N/A'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {rfp_record.prepared_by?.department?.department ?? ''}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <RfpBadge type="payee" value={rfp_record.payee_type} />

                                                <p className="text-xs text-muted-foreground">
                                                    {rfp_record.payee_type === 'supplier'
                                                    ? rfp_record.supplier_code
                                                    : rfp_record.employee_code}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                <div>{formatDate(rfp_record.created_at)}</div>
                                                <div className="text-xs">
                                                    {formatTime(rfp_record.created_at)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(rfp_record.due_date)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">
                                                {rfp_record.currency?.code || 'PHP'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <RfpBadge type="status" value={rfp_record.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                <div>{formatDate(rfp_record.updated_at)}</div>
                                                <div className="text-xs">
                                                    {formatTime(rfp_record.updated_at)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/rfp/records/${rfp_record.id}`}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrint(rfp_record)}>
                                                        <Printer className="h-4 w-4 mr-2" />
                                                        Print
                                                    </DropdownMenuItem>
                                                    {can('rfp-record-edit') && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/rfp/records/${rfp_record.id}/edit`}>
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {can('rfp-record-delete') && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleteId(rfp_record.id)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {rfp_records.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                        <p>
                            Showing {(rfp_records.current_page - 1) * rfp_records.per_page + 1} to{' '}
                            {Math.min(rfp_records.current_page * rfp_records.per_page, rfp_records.total)} of{' '}
                            {rfp_records.total} results
                        </p>
                        <Pagination className="w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={rfp_records.current_page > 1 ? `/rfp/records?page=${rfp_records.current_page - 1}` : '#'}
                                        className={rfp_records.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>

                                {/* First page */}
                                <PaginationItem>
                                    <PaginationLink
                                        href="/rfp/records?page=1"
                                        isActive={rfp_records.current_page === 1}
                                    >
                                        1
                                    </PaginationLink>
                                </PaginationItem>

                                {rfp_records.current_page > 3 && <PaginationEllipsis />}

                                {Array.from({ length: rfp_records.last_page }, (_, i) => i + 1)
                                    .filter(page =>
                                        page !== 1 &&
                                        page !== rfp_records.last_page &&
                                        page >= rfp_records.current_page - 1 &&
                                        page <= rfp_records.current_page + 1
                                    )
                                    .map(page => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href={`/rfp/records?page=${page}`}
                                                isActive={rfp_records.current_page === page}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))
                                }

                                {rfp_records.current_page < rfp_records.last_page - 2 && <PaginationEllipsis />}

                                {/* Last page */}
                                {rfp_records.last_page > 1 && (
                                    <PaginationItem>
                                        <PaginationLink
                                            href={`/rfp/records?page=${rfp_records.last_page}`}
                                            isActive={rfp_records.current_page === rfp_records.last_page}
                                        >
                                            {rfp_records.last_page}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        href={rfp_records.current_page < rfp_records.last_page ? `/rfp/records?page=${rfp_records.current_page + 1}` : '#'}
                                        className={rfp_records.current_page === rfp_records.last_page ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete RFP</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the RFP
                            record and all associated details.
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

            <RfpPdfPreviewDialog
                rfp_record={previewRfp}
                open={!!previewRfp}
                onClose={handleClosePdf}
            />
        </AppLayout>
    );
}
