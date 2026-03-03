import { Badge } from '@/components/ui/badge';

// Status
const statusColors = {
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    for_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
};

const statusLabels = {
    cancelled: 'Cancelled',
    draft: 'Draft',
    for_approval: 'For Approval',
    approved: 'Approved',
    paid: 'Paid',
};

// Area
const areaColors = {
    head_office: 'bg-purple-100 text-purple-800',
    mine_site: 'bg-orange-100 text-orange-800',
};

const areaLabels = {
    head_office: 'Head Office',
    mine_site: 'Mine Site',
};

// Payee
const payeeColors = {
    employee: 'bg-blue-100 text-blue-800',
    supplier: 'bg-teal-100 text-teal-800',
};

const payeeLabels = {
    employee: 'Employee',
    supplier: 'Supplier',
};

// Types
export type RfpStatus = keyof typeof statusLabels;
export type RfpArea = keyof typeof areaLabels;
export type RfpPayeeType = keyof typeof payeeLabels;

type RfpBadgeProps =
    | { type: 'status'; value: RfpStatus }
    | { type: 'area'; value: RfpArea }
    | { type: 'payee'; value: RfpPayeeType };

const configs = {
    status: { colors: statusColors, labels: statusLabels },
    area:   { colors: areaColors,   labels: areaLabels   },
    payee:  { colors: payeeColors,  labels: payeeLabels  },
};

export function RfpBadge({ type, value }: RfpBadgeProps) {
    const { colors, labels } = configs[type];
    const color = (colors as Record<string, string>)[value] ?? 'bg-gray-100 text-gray-800';
    const label = (labels as Record<string, string>)[value] ?? value;

    return (
        <Badge variant="secondary" className={color}>
            {label}
        </Badge>
    );
}
