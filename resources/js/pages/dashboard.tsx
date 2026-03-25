import { Head, Link } from '@inertiajs/react';
import { FileText, List, TrendingUp, AlertTriangle, HandCoins, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RfpBadge } from '@/components/rfp/rfp-display';
import { formatDate } from '@/lib/formatters';
import type { BreadcrumbItem, RfpRecord } from '@/types';
import type { RfpDashboardStats } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/rfp/dashboard' },
];

type Props = {
    stats: RfpDashboardStats;
    recent_records: RfpRecord[];
};

export default function Dashboard({ stats, recent_records }: Props) {
    const formatCurrency = (amount: number) =>
        amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const row1 = [
        {
            title: 'Total RFPs',
            value: stats.total_records,
            icon: FileText,
            iconClass: 'text-blue-500',
            sub: 'All accessible records',
            href: '/rfp/records',
        },
        // {
        //     title: 'Overdue',
        //     value: stats.overdue_count,
        //     icon: AlertTriangle,
        //     iconClass: 'text-orange-500',
        //     sub: 'Draft past due date',
        //     href: '/rfp/records?status=draft&overdue=1',
        // },
        {
            title: 'Total Value',
            value: `PHP ${formatCurrency(stats.total_grand_amount)}`,
            icon: TrendingUp,
            iconClass: 'text-indigo-500',
            sub: 'Subtotal across all RFPs',
            href: null,
        },
    ];

    const row2 = [
        {
            title: 'Cancelled',
            value: stats.total_cancelled,
            icon: XCircle,
            iconClass: 'text-red-400',
            sub: 'Cancelled records',
            href: '/rfp/records?status=cancelled',
        },
        {
            title: 'Draft',
            value: stats.total_draft,
            icon: List,
            iconClass: 'text-gray-500',
            sub: 'Record created',
            href: '/rfp/records?status=draft',
        },
        // {
        //     title: 'Paid',
        //     value: stats.total_paid,
        //     icon: HandCoins,
        //     iconClass: 'text-green-500',
        //     sub: 'Completed payments',
        //     href: '/rfp/records?status=paid',
        // },
    ];

    const renderCard = (card: typeof row1[0], key: string) => {
        const content = (
            <Card className={card.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {card.title}
                    </CardTitle>
                    <card.icon className={`h-4 w-4 ${card.iconClass}`} />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{card.value}</p>
                    {card.sub && (
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    )}
                </CardContent>
            </Card>
        );

        return card.href ? (
            <Link key={key} href={card.href}>{content}</Link>
        ) : (
            <div key={key}>{content}</div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Overview of your RFP records and activity.
                    </p>
                </div>

                {/* Row 1 */}
                <div className={`grid gap-4 md:grid-cols-${row1.length}`}>
                    {row1.map((card) => renderCard(card, card.title))}
                </div>

                {/* Row 2 */}
                <div className={`grid gap-4 md:grid-cols-${row2.length}`}>
                    {row2.map((card) => renderCard(card, card.title))}
                </div>

                {/* Recent Records */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Recent Records</CardTitle>
                        <span className="text-xs text-muted-foreground">Last 7 days</span>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {recent_records.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No records in the last 7 days.
                                </p>
                            ) : (
                                recent_records.map((rfp) => {
                                    // const isOverdue =
                                    //     rfp.status === 'draft' &&
                                    //     new Date(rfp.due_date) < new Date(new Date().toDateString());

                                    return (
                                        <div
                                            key={rfp.id}
                                            className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/rfp/records/${rfp.id}`}
                                                            className="text-sm font-medium hover:underline text-primary"
                                                        >
                                                            {rfp.rfp_number}
                                                        </Link>
                                                        {/* {isOverdue && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                Overdue
                                                            </span>
                                                        )} */}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {rfp.prepared_by?.name ?? '—'}
                                                        {rfp.prepared_by?.department?.department
                                                            ? ` · ${rfp.prepared_by.department.department}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-right">
                                                <div>
                                                    <p className="text-xs font-medium">
                                                        {rfp.currency?.code ?? 'PHP'}{' '}
                                                        {rfp.subtotal_details_amount
                                                            ? formatCurrency(Number(rfp.subtotal_details_amount))
                                                            : '—'}
                                                    </p>
                                                    {/* <p className={`text-xs ${isOverdue ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                                                        Due {formatDate(rfp.due_date)}
                                                    </p> */}
                                                </div>
                                                <RfpBadge type="status" value={rfp.status} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
