import { Head, Link } from '@inertiajs/react';
import { RefreshCw, Users as UsersIcon, Search } from 'lucide-react';
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
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import type { SapSupplier } from '@/types';

type Props = {
    suppliers: {
        data: SapSupplier[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

export default function Index({ suppliers }: Props) {
    const [search, setSearch] = useState('');

    const filteredSuppliers = suppliers.data.filter(
        (supplier) =>
            supplier.card_code.toLowerCase().includes(search.toLowerCase()) ||
            supplier.card_name.toLowerCase().includes(search.toLowerCase()) ||
            supplier.tin?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderPaginationItems = () => {
        const items = [];
        const currentPage = suppliers.current_page;
        const lastPage = suppliers.last_page;

        // Always show first page
        items.push(
            <PaginationItem key={1}>
                <PaginationLink href={`/rfp/suppliers?page=1`} isActive={currentPage === 1}>
                    1
                </PaginationLink>
            </PaginationItem>
        );

        // Show ellipsis if needed
        if (currentPage > 3) {
            items.push(<PaginationEllipsis key="ellipsis-start" />);
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink href={`/rfp/suppliers?page=${i}`} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        // Show ellipsis if needed
        if (currentPage < lastPage - 2) {
            items.push(<PaginationEllipsis key="ellipsis-end" />);
        }

        // Always show last page if there's more than 1 page
        if (lastPage > 1) {
            items.push(
                <PaginationItem key={lastPage}>
                    <PaginationLink href={`/rfp/suppliers?page=${lastPage}`} isActive={currentPage === lastPage}>
                        {lastPage}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Suppliers', href: '/rfp/suppliers' },
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
                        <a href="/rfp/suppliers">
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Refresh
                        </a>
                    </Button>
                </div>

                <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by code, name, or TIN..."
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
                                <TableHead className="w-[130px]">Supplier Code</TableHead>
                                <TableHead>Supplier Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="w-[150px]">TIN</TableHead>
                                <TableHead className="w-[180px]">Last Synced</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No suppliers found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">
                                            {supplier.card_code}
                                        </TableCell>
                                        <TableCell>{supplier.card_name}</TableCell>
                                        <TableCell>
                                            <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                                                {supplier.address || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{supplier.tin || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(supplier.last_synced_at)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {suppliers.last_page > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href={suppliers.current_page > 1 ? `/rfp/suppliers?page=${suppliers.current_page - 1}` : '#'}
                                    className={suppliers.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>

                            {renderPaginationItems()}

                            <PaginationItem>
                                <PaginationNext
                                    href={suppliers.current_page < suppliers.last_page ? `/rfp/suppliers?page=${suppliers.current_page + 1}` : '#'}
                                    className={suppliers.current_page === suppliers.last_page ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </AppLayout>
    );
}
