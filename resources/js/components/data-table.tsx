import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Download, Columns, GripVertical } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    exportFileName?: string;
    timezone?: string;
    initialColumnVisibility?: VisibilityState;
    storageKey?: string;
}

const loadState = <T,>(storageKey: string | undefined, key: string, fallback: T): T => {
    if (!storageKey) return fallback;
    try {
        const stored = localStorage.getItem(`datatable_${storageKey}_${key}`);
        return stored ? JSON.parse(stored) : fallback;
    } catch {
        return fallback;
    }
};

const saveState = (storageKey: string | undefined, key: string, value: unknown) => {
    if (!storageKey) return;
    try {
        localStorage.setItem(`datatable_${storageKey}_${key}`, JSON.stringify(value));
    } catch {}
};

export function DataTable<TData>({ columns, data, exportFileName = 'export', timezone = 'UTC', initialColumnVisibility = {}, storageKey }: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>(() => loadState(storageKey, 'sorting', []));
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => loadState(storageKey, 'columnFilters', []));
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => loadState(storageKey, 'columnVisibility', initialColumnVisibility));
    const [globalFilter, setGlobalFilter] = useState<string>(() => loadState(storageKey, 'globalFilter', ''));
    const [columnOrder, setColumnOrder] = useState<string[]>(() => loadState(storageKey, 'columnOrder', columns.map((c) => (c as any).accessorKey ?? (c as any).id ?? '')));
    const [pageSize, setPageSize] = useState<number>(() => loadState(storageKey, 'pageSize', 10));
    const [pageIndex, setPageIndex] = useState(0);
    const [pageInputValue, setPageInputValue] = useState(String(pageIndex + 1));
    useEffect(() => {
        setPageInputValue(String(pageIndex + 1));
    }, [pageIndex]);

    const multiFieldFilter: FilterFn<any> = (row, columnId, filterValue) => {
        const search = String(filterValue).toLowerCase();
        const colValue = String(row.getValue(columnId) ?? '').toLowerCase();
        // Handle both *_code -> *_name and code -> name patterns
        const nameKey = columnId.includes('_code')
            ? columnId.replace('_code', '_name')
            : 'name';
        const nameValue = String(row.getValue(nameKey) ?? '').toLowerCase();
        return colValue.includes(search) || nameValue.includes(search);
    };

    const handleSetSorting: typeof setSorting = (updater) => {
        setSorting((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            saveState(storageKey, 'sorting', next);
            return next;
        });
    };

    const handleSetColumnFilters: typeof setColumnFilters = (updater) => {
        setColumnFilters((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            saveState(storageKey, 'columnFilters', next);
            return next;
        });
    };

    const handleSetColumnVisibility: typeof setColumnVisibility = (updater) => {
        setColumnVisibility((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            saveState(storageKey, 'columnVisibility', next);
            return next;
        });
    };

    const handleSetGlobalFilter = (val: string) => {
        setGlobalFilter(val);
        saveState(storageKey, 'globalFilter', val);
    };

    const handleSetColumnOrder = (updater: any) => {
        setColumnOrder((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            saveState(storageKey, 'columnOrder', next);
            return next;
        });
    };

    const handleSetPageSize = (val: number) => {
        setPageSize(val);
        saveState(storageKey, 'pageSize', val);
    };

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
            columnOrder,
            pagination: { pageIndex, pageSize },
        },
        filterFns: {
            multiField: multiFieldFilter,
        },
        onSortingChange: handleSetSorting,
        onColumnFiltersChange: handleSetColumnFilters,
        onColumnVisibilityChange: handleSetColumnVisibility,
        onGlobalFilterChange: handleSetGlobalFilter,
        onColumnOrderChange: handleSetColumnOrder,
        onPaginationChange: (updater) => {
            const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
            setPageIndex(next.pageIndex);
            saveState(storageKey, 'pageSize', next.pageSize);
            setPageSize(next.pageSize);
        },
        enableColumnPinning: true,
        initialState: {
            columnPinning: {
                right: ['actions'],
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: false,
    });

    const handleReset = () => {
        if (storageKey) {
            ['sorting', 'columnFilters', 'columnVisibility', 'globalFilter', 'columnOrder', 'pageSize'].forEach((key) => {
                localStorage.removeItem(`datatable_${storageKey}_${key}`);
            });
        }
        setSorting([]);
        setColumnFilters([]);
        setColumnVisibility(initialColumnVisibility);
        setGlobalFilter('');
        setColumnOrder(columns.map((c) => (c as any).accessorKey ?? (c as any).id ?? ''));
        setPageSize(10);
        setPageIndex(0);
    };

    const handleExport = () => {
        const rows = table.getFilteredRowModel().rows.map((row) =>
            row.getVisibleCells()
                .filter((cell) => cell.column.id !== 'actions')
                .reduce((acc, cell) => {
                    const header = String(cell.column.columnDef.header ?? cell.column.id);
                    acc[header] = cell.getValue();
                    return acc;
                }, {} as Record<string, unknown>)
        );
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const timestamp = new Date()
            .toLocaleString('sv-SE', { timeZone: timezone })
            .replace(/[\s:]/g, '-')
            .replace(',', '');
        XLSX.writeFile(wb, `${exportFileName}_${timestamp}.xlsx`);
    };

    // Drag-and-drop column reorder
    const [dragOver, setDragOver] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, colId: string) => {
        e.dataTransfer.setData('colId', colId);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        const sourceId = e.dataTransfer.getData('colId');
        if (sourceId === targetId) return;
        handleSetColumnOrder((prev: string[]) => {
            const next = [...prev];
            const from = next.indexOf(sourceId);
            const to = next.indexOf(targetId);
            next.splice(from, 1);
            next.splice(to, 0, sourceId);
            return next;
        });
        setDragOver(null);
    };

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        placeholder="Search all columns..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-8 w-64"
                    />
                    <Select value={String(pageSize)} onValueChange={(v) => handleSetPageSize(Number(v))}>
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
                    {/* Column Visibility */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Columns className="mr-2 h-4 w-4" />Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                            {table.getAllLeafColumns()
                                .filter((col) => col.id !== 'actions' && !(col.columnDef.meta as any)?.hidden)
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

                    {/* Export */}
                    <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />Export
                    </Button>

                    {/* Reset */}
                    <Button variant="outline" size="sm" className="h-8" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" />Reset
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        draggable={header.column.id !== 'actions'}
                                        onDragStart={(e) => handleDragStart(e, header.column.id)}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(header.column.id); }}
                                        onDrop={(e) => handleDrop(e, header.column.id)}
                                        style={{
                                            position: header.column.getIsPinned() ? 'sticky' : undefined,
                                            right: header.column.getIsPinned() === 'right' ? 0 : undefined,
                                            zIndex: header.column.getIsPinned() ? 1 : undefined,
                                            minWidth: header.column.columnDef.size,
                                            width: header.column.columnDef.size,
                                        }}
                                        className={`whitespace-nowrap select-none bg-background border-r
                                            ${dragOver === header.column.id ? 'bg-accent' : ''}
                                            ${header.column.getCanSort() ? 'cursor-pointer' : ''}
                                            ${header.column.getIsPinned() ? 'border-l-2 border-l-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]' : ''}
                                        `}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                header.column.getIsSorted() === 'asc' ? <ArrowUp className="h-3 w-3" /> :
                                                header.column.getIsSorted() === 'desc' ? <ArrowDown className="h-3 w-3" /> :
                                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            {header.column.id !== 'actions' && (
                                                <GripVertical className="h-3 w-3 text-muted-foreground ml-auto opacity-40" />
                                            )}
                                        </div>
                                        {/* Per-column filter */}
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
                        {table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        style={{
                                            position: cell.column.getIsPinned() ? 'sticky' : undefined,
                                            right: cell.column.getIsPinned() === 'right' ? 0 : undefined,
                                            zIndex: cell.column.getIsPinned() ? 1 : undefined,
                                        }}
                                        className={`border-r bg-background ${cell.column.getIsPinned() ? 'border-l-2 border-l-border shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>
                    Showing {table.getRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * pageSize + 1}–
                    {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} records
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                    <div className="flex items-center gap-1 text-sm">
                        <span>Page</span>
                        <Input
                            type="number"
                            min={1}
                            max={table.getPageCount()}
                            value={pageInputValue}
                            onChange={(e) => {
                                setPageInputValue(e.target.value);
                                const page = Number(e.target.value) - 1;
                                if (page >= 0 && page < table.getPageCount()) {
                                    table.setPageIndex(page);
                                }
                            }}
                            onBlur={() => {
                                // Snap back to current valid page if input is left empty/invalid
                                setPageInputValue(String(pageIndex + 1));
                            }}
                            className="h-8 w-14 text-center"
                        />
                        <span>of {table.getPageCount()}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
                </div>
            </div>
        </div>
    );
}
