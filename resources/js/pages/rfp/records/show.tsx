import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Printer, ChevronDown, ChevronRight, Ban, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { RfpRecord, RfpLog } from '@/types';
import { formatDate, formatDateTime, formatAmount } from '@/lib/formatters';
import { usePermission } from '@/hooks/use-permission';
import { RfpBadge } from '@/components/rfp/rfp-display';
import { RfpPdfPreviewDialog } from '@/components/rfp/rfp-pdf-preview-dialog';
import { RfpActionDialogs, type RfpActionType } from '@/components/rfp/rfp-action-dialogs';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw as ResetIcon, Download, Columns } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';

type Props = {
    rfp_record: RfpRecord;
    logs: RfpLog[];
};

export default function Show({ rfp_record, logs }: Props) {
    const [activeAction, setActiveAction] = useState<RfpActionType>(null);
    const [expandedLogIds, setExpandedLogIds] = useState<Set<number>>(new Set());
    const [previewPdf, setPreviewPdf] = useState(false);

    const handleDelete = (remarks: string) => {
        router.delete(`/rfp/records/${rfp_record.id}`, {
            data: { remarks },
            onSuccess: () => router.visit('/rfp/records'),
        });
    };
    const handleCancel = (remarks: string) => {
        router.patch(`/rfp/records/${rfp_record.id}/cancel`, { remarks }, {
            onSuccess: () => setActiveAction(null),
        });
    };
    const handleRevert = (remarks: string) => {
        router.patch(`/rfp/records/${rfp_record.id}/revert`, { remarks }, {
            onSuccess: () => setActiveAction(null),
        });
    };

    const handlePrint = () => setPreviewPdf(true);
    const handleClosePdf = () => setPreviewPdf(false);

    const toggleLogExpand = (logId: number) => {
        setExpandedLogIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) newSet.delete(logId);
            else newSet.add(logId);
            return newSet;
        });
    };

    const parseLogDetails = (details: string | null) => {
        if (!details) return null;
        try { return JSON.parse(details); } catch { return null; }
    };

    // ── Log DataTable (inline, with sub-row support) ──────────────────────
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [pageIndex, setPageIndex] = useState(0);

    const logColumns: ColumnDef<RfpLog>[] = [
        {
            id: 'expand',
            header: '',
            size: 40,
            enableSorting: false,
            enableColumnFilter: false,
            cell: () => null, // rendered manually below
        },
        {
            accessorKey: 'user',
            header: 'User',
            size: 160,
            accessorFn: (row) => row.user?.name ?? 'System',
        },
        {
            accessorKey: 'from',
            header: 'From',
            size: 120,
            accessorFn: (row) => row.from ?? '',
        },
        {
            accessorKey: 'into',
            header: 'To',
            size: 120,
            accessorFn: (row) => row.into ?? '',
        },
        {
            accessorKey: 'created_at',
            header: 'Date',
            size: 160,
            accessorFn: (row) => formatDateTime(row.created_at),
        },
        {
            accessorKey: 'remarks',
            header: 'Remarks',
            accessorFn: (row) => row.remarks ?? '',
        },
    ];

    const logTable = useReactTable({
        data: logs,
        columns: logColumns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
            pagination: { pageIndex, pageSize },
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: (updater) => {
            const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
            setPageIndex(next.pageIndex);
            setPageSize(next.pageSize);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const handleLogExport = () => {
        const rows = logTable.getFilteredRowModel().rows.map((row) =>
            row.getVisibleCells()
                .filter((cell) => cell.column.id !== 'expand')
                .reduce((acc, cell) => {
                    acc[String(cell.column.columnDef.header ?? cell.column.id)] = cell.getValue();
                    return acc;
                }, {} as Record<string, unknown>)
        );
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Logs');
        XLSX.writeFile(wb, `rfp-activity-logs.xlsx`);
    };

    const { can } = usePermission();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/rfp/dashboard' },
                { title: 'Records', href: '/rfp/records' },
                { title: rfp_record.rfp_number, href: `/rfp/records/${rfp_record.id}` },
            ]}
        >
            <Head title={rfp_record.rfp_number} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">View RFP</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-muted-foreground">{rfp_record.rfp_number}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/rfp/records">
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print
                        </Button>
                        {can('rfp-record-edit') && rfp_record.status !== 'cancelled' && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/rfp/records/${rfp_record.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        {can('rfp-record-revert') && (rfp_record.status === 'paid' || rfp_record.status === 'cancelled') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveAction('revert')}
                                className="text-yellow-600 hover:text-yellow-600"
                            >
                                <RotateCcw className="h-4 w-4 mr-1.5" />
                                Revert to Draft
                            </Button>
                        )}
                        {can('rfp-record-cancel') && rfp_record.status !== 'cancelled' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveAction('cancel')}
                                className="text-orange-600 hover:text-orange-600"
                            >
                                <Ban className="h-4 w-4 mr-1.5" />
                                Cancel
                            </Button>
                        )}
                        {can('rfp-record-delete') && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveAction('delete')}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Requestor Information */}
                <Card className="mt-4">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Requestor Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Prepared By</p>
                                <p className="text-sm font-medium">{rfp_record.prepared_by?.name ?? 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Department</p>
                                <p className="text-sm">{rfp_record.prepared_by?.department?.department ?? 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="text-sm">
                                    <RfpBadge type="status" value={rfp_record.status} />
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            <div>
                                <p className="text-xs text-muted-foreground">RFP No.</p>
                                <p className="text-sm font-medium">{rfp_record.rfp_number}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground">Office</p>
                                <p className="text-sm">
                                    <RfpBadge type="office" value={rfp_record.office} />
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Payee Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            <div>
                                <p className="text-xs text-muted-foreground">Type</p>
                                <p className="text-sm font-medium">
                                    <RfpBadge type="payee" value={rfp_record.payee_type} />
                                </p>
                            </div>
                            <Separator />
                            {rfp_record.payee_type === 'supplier' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Supplier Code</p>
                                            <p className="text-sm">{rfp_record.supplier_code || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Supplier Name</p>
                                            <p className="text-sm">{rfp_record.supplier_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Supplier TIN</p>
                                            <p className="text-sm">{rfp_record.supplier?.tin || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Supplier Address</p>
                                            <p className="text-sm">{rfp_record.supplier?.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Vendor Ref</p>
                                            <p className="text-sm">{rfp_record.vendor_ref || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Currency</p>
                                            <p className="text-sm">
                                                {rfp_record.currency?.code} - {rfp_record.currency?.name}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Employee Code</p>
                                        <p className="text-sm">{rfp_record.employee_code || 'N/A'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Employee Name</p>
                                        <p className="text-sm">{rfp_record.employee_name || 'N/A'}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Currency</p>
                                        <p className="text-sm">
                                            {rfp_record.currency?.code} - {rfp_record.currency?.name}
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Document Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Prepared Date</p>
                                <p className="text-sm font-medium">{formatDate(rfp_record.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Due Date</p>
                                <p className="text-sm font-medium">{formatDate(rfp_record.due_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">RR No.</p>
                                <p className="text-sm font-medium">{rfp_record.rr_no || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">PO No.</p>
                                <p className="text-sm font-medium">{rfp_record.po_no || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Main Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Short Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rfp_record.details.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No information found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rfp_record.details.map((detail) => (
                                            <TableRow key={detail.id}>
                                                <TableCell>
                                                    {detail.usage ? `${detail.usage.description}` : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatAmount(Number(detail.total_amount))}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Purpose</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{rfp_record.purpose || 'N/A'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Timestamps</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm">{formatDateTime(rfp_record.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Last Updated</p>
                                    <p className="text-sm">{formatDateTime(rfp_record.updated_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Signatories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 divide-x border rounded-lg">
                            {(['prepared_by', 'recommending_approval_by', 'approved_by', 'concurred_by'] as const).map((role) => {
                                const labels: Record<string, string> = {
                                    prepared_by: 'Prepared By',
                                    recommending_approval_by: 'Recommending Approval By',
                                    approved_by: 'Approved By',
                                    concurred_by: 'Concurred By',
                                };
                                const signs = rfp_record.signs?.filter((s) => s.details === role) ?? [];
                                return (
                                    <div key={role} className="flex flex-col p-4 gap-2">
                                        <p className="text-xs text-muted-foreground font-medium">{labels[role]}</p>
                                        {signs.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">N/A</p>
                                        ) : (
                                            signs.map((sign) => (
                                                <p key={sign.id} className="text-sm font-medium">{sign.user?.name || 'N/A'}</p>
                                            ))
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity History */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Activity History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Input
                                    placeholder="Search all columns..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="h-8 w-64"
                                />
                                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0); }}>
                                    <SelectTrigger className="h-8 w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map((n) => (
                                            <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8">
                                            <Columns className="mr-2 h-4 w-4" />Columns
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {logTable.getAllLeafColumns()
                                            .filter((col) => col.id !== 'expand')
                                            .map((col) => (
                                                <DropdownMenuCheckboxItem
                                                    key={col.id}
                                                    checked={col.getIsVisible()}
                                                    onCheckedChange={(val) => col.toggleVisibility(val)}
                                                    className="capitalize"
                                                >
                                                    {String(col.columnDef.header ?? col.id)}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="outline" size="sm" className="h-8" onClick={handleLogExport}>
                                    <Download className="mr-2 h-4 w-4" />Export
                                </Button>
                                <Button variant="outline" size="sm" className="h-8" onClick={() => {
                                    setSorting([]);
                                    setColumnFilters([]);
                                    setColumnVisibility({});
                                    setGlobalFilter('');
                                    setPageSize(10);
                                    setPageIndex(0);
                                }}>
                                    <ResetIcon className="mr-2 h-4 w-4" />Reset
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    {logTable.getHeaderGroups().map((hg) => (
                                        <TableRow key={hg.id}>
                                            {hg.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className={`whitespace-nowrap bg-background ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    style={{ minWidth: header.column.columnDef.size, width: header.column.columnDef.size }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getCanSort() && (
                                                            header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> :
                                                            header.column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> :
                                                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    {header.column.getCanFilter() && (
                                                        <Input
                                                            placeholder="Filter..."
                                                            value={(header.column.getFilterValue() as string) ?? ''}
                                                            onChange={(e) => header.column.setFilterValue(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-1 h-7 text-xs font-normal"
                                                        />
                                                    )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {logTable.getRowModel().rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={logColumns.length} className="py-8 text-center text-sm text-muted-foreground">
                                                No logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logTable.getRowModel().rows.map((row) => {
                                            const log = row.original;
                                            const parsedDetails = parseLogDetails(log.details);
                                            const isExpanded = expandedLogIds.has(log.id);
                                            const hasDetails = parsedDetails && Array.isArray(parsedDetails) && parsedDetails.length > 0;

                                            return (
                                                <React.Fragment key={row.id}>
                                                    <TableRow>
                                                        {/* Expand toggle cell */}
                                                        <TableCell style={{ width: 40, minWidth: 40 }}>
                                                            {hasDetails && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => toggleLogExpand(log.id)}
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                        {/* All other visible cells except the expand column */}
                                                        {row.getVisibleCells().filter(c => c.column.id !== 'expand').map((cell) => {
                                                            const val = cell.getValue() as string;
                                                            if (cell.column.id === 'from' || cell.column.id === 'into') {
                                                                return (
                                                                    <TableCell key={cell.id}>
                                                                        {val ? <Badge variant="outline">{val}</Badge> : 'N/A'}
                                                                    </TableCell>
                                                                );
                                                            }
                                                            if (cell.column.id === 'user') {
                                                                return (
                                                                    <TableCell key={cell.id} className="font-medium">{val}</TableCell>
                                                                );
                                                            }
                                                            if (cell.column.id === 'remarks') {
                                                                return (
                                                                    <TableCell key={cell.id} className="text-muted-foreground">{val || 'N/A'}</TableCell>
                                                                );
                                                            }
                                                            return (
                                                                <TableCell key={cell.id}>{val || 'N/A'}</TableCell>
                                                            );
                                                        })}
                                                    </TableRow>

                                                    {/* Expandable sub-row for changes */}
                                                    {isExpanded && hasDetails && (
                                                        <TableRow>
                                                            <TableCell colSpan={logColumns.filter(c => logTable.getColumn((c as any).accessorKey ?? (c as any).id)?.getIsVisible() !== false).length + 1} className="bg-muted/50 p-0">
                                                                <div className="px-12 py-3">
                                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Changes:</p>
                                                                    <div className="border rounded-md bg-background">
                                                                        <table className="w-full text-xs">
                                                                            <thead className="bg-muted/50">
                                                                                <tr>
                                                                                    <th className="px-3 py-2 text-left font-medium w-[25%]">Field</th>
                                                                                    <th className="px-3 py-2 text-left font-medium w-[37.5%]">Old Value</th>
                                                                                    <th className="px-3 py-2 text-left font-medium w-[37.5%]">New Value</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {parsedDetails.map((change: any, idx: number) => (
                                                                                    <tr key={idx} className="border-t">
                                                                                        <td className="px-3 py-2 font-medium">{change.field}</td>
                                                                                        <td className="px-3 py-2 text-muted-foreground break-words">{change.old}</td>
                                                                                        <td className="px-3 py-2 text-primary break-words">{change.new}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <p>
                                Showing {logTable.getRowModel().rows.length === 0 ? 0 : pageIndex * pageSize + 1}–
                                {Math.min((pageIndex + 1) * pageSize, logTable.getFilteredRowModel().rows.length)} of {logTable.getFilteredRowModel().rows.length} records
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => logTable.previousPage()} disabled={!logTable.getCanPreviousPage()}>Previous</Button>
                                <span>Page {pageIndex + 1} of {logTable.getPageCount()}</span>
                                <Button variant="outline" size="sm" onClick={() => logTable.nextPage()} disabled={!logTable.getCanNextPage()}>Next</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <RfpActionDialogs
                rfpNumber={rfp_record.rfp_number}
                activeAction={activeAction}
                onClose={() => setActiveAction(null)}
                onConfirm={(action, remarks) => {
                    if (action === 'delete') handleDelete(remarks);
                    else if (action === 'cancel') handleCancel(remarks);
                    else if (action === 'revert') handleRevert(remarks);
                }}
            />

            <RfpPdfPreviewDialog
                rfp_record={rfp_record}
                open={previewPdf}
                onClose={handleClosePdf}
            />
        </AppLayout>
    );
}
