import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type MatrixRow = {
    amount: string;
    ms: string;
    ho: string;
};

const sectionH: MatrixRow[] = [
    {
        amount: '1 – 500k',
        ms: 'MMD Manager (site) w/ Finance Head (site) concurrence',
        ho: 'MMD Manager (HO) w/ Finance Controller/Comptroller concurrence',
    },
    {
        amount: '>500k – 1M',
        ms: 'Supply Chain Head w/ Finance Controller/Comptroller concurrence',
        ho: 'Supply Chain Head w/ Finance Controller/Comptroller concurrence',
    },
    {
        amount: '>1M – 5M',
        ms: 'Treasurer & CFO',
        ho: 'Treasurer & CFO',
    },
    {
        amount: '>5M – 50M',
        ms: 'President & CEO',
        ho: 'President & CEO',
    },
];

const sectionI: MatrixRow[] = [
    {
        amount: '1 – 500k',
        ms: 'MMD Manager w/ Finance Head concurrence',
        ho: 'MMD Manager w/ Finance Controller/Comptroller concurrence',
    },
    {
        amount: '>500k – 1M',
        ms: 'Supply Chain Head w/ Finance Controller/Comptroller concurrence',
        ho: 'Supply Chain Head w/ Finance Controller/Comptroller concurrence',
    },
    {
        amount: '>1M – 5M',
        ms: 'Treasurer & CFO',
        ho: 'Treasurer & CFO',
    },
    {
        amount: '>5M – 50M',
        ms: 'President & CEO',
        ho: 'President & CEO',
    },
];

const sectionJ: MatrixRow[] = [
    {
        amount: '1 – 500k',
        ms: 'Resident Manager/Mine Site Head w/ Finance Head concurrence',
        ho: 'Highest Manager/Officer of the Department w/ Finance Controller/Comptroller concurrence',
    },
    {
        amount: '>500k – 1M',
        ms: 'Highest Manager/Officer of the Department w/ Finance Controller/Comptroller concurrence',
        ho: 'Highest Manager/Officer of the Department w/ Finance Controller/Comptroller concurrence',
    },
    {
        amount: '>1M – 5M',
        ms: 'Treasurer & CFO',
        ho: 'Treasurer & CFO',
    },
    {
        amount: '>5M – 50M',
        ms: 'President & CEO',
        ho: 'President & CEO',
    },
];

type Section = {
    label: string;
    rows: MatrixRow[];
    mergedRows?: number[]; // row indexes where MS and HO are the same (merge display)
};

const sections: Section[] = [
    // {
    //     label: 'H. Covering Advance Payment Against PO – With Budget',
    //     rows: sectionH,
    //     mergedRows: [1, 2, 3],
    // },
    // {
    //     label: 'I. Covering Indent PO – With Budget',
    //     rows: sectionI,
    //     mergedRows: [1, 2, 3],
    // },
    {
        label: 'J. Without PO – With Budget',
        rows: sectionJ,
        mergedRows: [2, 3],
    },
];

function MatrixSection({ section }: { section: Section }) {
    return (
        <div className="rounded-lg border overflow-hidden">
            {/* Section title row */}
            <div className="bg-muted px-4 py-2.5 border-b">
                <p className="text-sm font-semibold text-center">{section.label}</p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-32 text-center font-semibold">Amount</TableHead>
                        <TableHead className="text-center font-semibold">MS (Mine Site)</TableHead>
                        <TableHead className="text-center font-semibold">HO (Head Office)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {section.rows.map((row, index) => {
                        const isMerged = section.mergedRows?.includes(index);
                        return (
                            <TableRow key={index}>
                                <TableCell className="text-center font-medium text-sm w-32">
                                    {row.amount}
                                </TableCell>
                                {isMerged ? (
                                    <TableCell
                                        colSpan={2}
                                        className="text-center text-sm text-muted-foreground"
                                    >
                                        {row.ms}
                                    </TableCell>
                                ) : (
                                    <>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {row.ms}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {row.ho}
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

export default function ApprovalMatrixIndex() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/rfp/dashboard' },
                { title: 'Approval Matrix', href: '/rfp/approval-matrix' },
            ]}
        >
            <Head title="Approval Matrix" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Approval Matrix</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        BOD approvals (&gt;50M) are excluded from this table.
                    </p>
                </div>

                <div className="space-y-6">
                    {sections.map((section) => (
                        <MatrixSection key={section.label} section={section} />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
