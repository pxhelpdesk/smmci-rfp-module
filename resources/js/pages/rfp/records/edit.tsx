import { useForm, Head, usePage } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputAmount from '@/components/ui/input-amount';
import DateTimePicker from '@/components/ui/date-time-picker';
import { formatDate } from '@/lib/formatters';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select as SelectUI,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import type { RfpRecord, RfpCategory, RfpUsage, RfpCurrency, RfpDetail, UserOption, SapSupplierOption } from '@/types';
import type { SharedData } from '@/types';
import { RfpBadge } from '@/components/rfp/rfp-display';
import { RfpSignatoriesForm, type SignatoriesState, dedupeSignatories } from '@/components/rfp/rfp-signatories-form';
import { toast } from 'sonner';

type ChangeLog = {
    field: string;
    old: string;
    new: string;
};

type DetailFormItem = {
    id?: number;
    rfp_category_id: number | null;
    rfp_usage_id: number | null;
    total_amount: number | null;
};

type Props = {
    rfp_record: RfpRecord;
    categories: RfpCategory[];
    currencies: RfpCurrency[];
    users: { id: number; name: string; department?: string }[];
    scopeOwner?: { id: number; name: string; department?: string } | null;
    departmentHead?: { id: number; name: string; department?: string } | null;
    residentManager?: { id: number; name: string; department?: string } | null;
    cfo?: { id: number; name: string; department?: string } | null;
    ceo?: { id: number; name: string; department?: string } | null;
};

const Req = () => <span className="text-destructive ml-0.5">*</span>;

export default function Edit({ rfp_record, categories, currencies, users, scopeOwner, departmentHead, residentManager, cfo, ceo }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [suppliers, setSuppliers] = useState<SapSupplierOption[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [showLogDialog, setShowLogDialog] = useState(false);
    const [logRemarks, setLogRemarks] = useState('');
    const [detectedChanges, setDetectedChanges] = useState<ChangeLog[]>([]);
    const [logRemarksError, setLogRemarksError] = useState(false);

    // Per-category usage cache to support per-row category+usage selection
    const [usagesByCategory, setUsagesByCategory] = useState<Record<number, RfpUsage[]>>({});

    const [signatories, setSignatories] = useState<SignatoriesState>(() => {
        const signs = rfp_record.signs ?? [];
        const toOption = (sign: typeof signs[0]): UserOption | null =>
            sign.user_id ? { value: sign.user_id, label: sign.user?.name ?? '', department: sign.user?.department?.department } : null;

        // Return raw from DB — do NOT dedupe here so the form can show duplicate warnings visually
        return {
            recommending_approval_by: signs.filter(s => s.details === 'recommending_approval_by').map(toOption).filter(Boolean) as UserOption[],
            approved_by: signs.filter(s => s.details === 'approved_by').map(toOption).filter(Boolean) as UserOption[],
            concurred_by: signs.filter(s => s.details === 'concurred_by').map(toOption).filter(Boolean) as UserOption[],
        };
    });

    // Load usages for a category, using cache to avoid duplicate requests
    const loadUsagesForCategory = async (categoryId: number) => {
        if (usagesByCategory[categoryId]) return;
        try {
            const res = await fetch(`/rfp/usages/category/${categoryId}`);
            const json = await res.json();
            setUsagesByCategory(prev => ({ ...prev, [categoryId]: json }));
        } catch (error) {
            console.error('Failed to load usages', error);
        }
    };

    const loadSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const res = await fetch('/rfp/api/sap/suppliers');
            const json = await res.json();
            setSuppliers(json);
        } catch (error) {
            console.error('Failed to load suppliers', error);
        }
        setLoadingSuppliers(false);
    };

    // Pre-load usages for all categories used in existing details
    useEffect(() => {
        const categoryIds = rfp_record.details
            ?.map(d => d.usage?.category?.id)
            .filter((id): id is number => Boolean(id));
        [...new Set(categoryIds)].forEach(id => loadUsagesForCategory(id));
    }, []);

    // Pre-load suppliers if record has a supplier
    useEffect(() => {
        if (rfp_record.supplier_code) {
            loadSuppliers();
        }
    }, []);

    const { data, setData, put, processing, errors, transform } = useForm<{
        ap_no: string;
        due_date: string;
        rr_no: string;
        po_no: string;
        swp_pr_no: string;
        swp_rcw_no: string;
        office: 'head_office' | 'mine_site';
        payee_type: 'employee' | 'supplier';
        employee_code: string;
        employee_name: string;
        supplier_code: string | null;
        supplier_name: string | null;
        vendor_ref: string;
        rfp_currency_id: number | null;
        purpose: string;
        details: DetailFormItem[];
        signs: { user_id: number; details: string }[];
        log_remarks?: string;
    }>({
        ap_no: rfp_record.ap_no || '',
        due_date: rfp_record.due_date || '',
        rr_no: rfp_record.rr_no || '',
        po_no: rfp_record.po_no || '',
        swp_pr_no: rfp_record.swp_pr_no || '',
        swp_rcw_no: rfp_record.swp_rcw_no || '',
        office: rfp_record.office,
        payee_type: rfp_record.payee_type,
        employee_code: rfp_record.employee_code || '',
        employee_name: rfp_record.employee_name || '',
        supplier_code: rfp_record.supplier_code,
        supplier_name: rfp_record.supplier_name || '',
        vendor_ref: rfp_record.vendor_ref || '',
        rfp_currency_id: rfp_record.rfp_currency_id,
        purpose: rfp_record.purpose || '',
        details: rfp_record.details?.length > 0
            ? rfp_record.details.map(item => ({
                id: item.id,
                rfp_category_id: item.usage?.category?.id ?? null,
                rfp_usage_id: item.rfp_usage_id,
                total_amount: item.total_amount,
            }))
            : [{ rfp_category_id: null, rfp_usage_id: null, total_amount: null }],
        signs: [],
        log_remarks: '',
    });

    // ── Helpers for human-readable change log values ──────────────
    const getCurrencyLabel = (id: number | null | undefined): string => {
        if (!id) return 'N/A';
        const currency = currencies.find(c => c.id === id);
        return currency ? `${currency.code} - ${currency.name}` : String(id);
    };

    const getSupplierLabel = (code: string | null | undefined, name: string | null | undefined): string => {
        if (!code) return 'N/A';
        // Try to find label from loaded suppliers first (most complete)
        const found = suppliers.find(s => s.value === code);
        if (found) return found.label;
        // Fallback: compose from code + name props
        return name ? `${code} - ${name}` : code;
    };

    // Detect field-level changes for the change log dialog
    useEffect(() => {
        const changes: ChangeLog[] = [];

        const formatDisplayValue = (field: string, value: any) => {
            if (value === null || value === undefined || value === '') return 'N/A';
            if (field === 'due_date') return value.split('T')[0];
            return value;
        };

        const checkField = (field: string, label: string, oldVal: any, newVal: any, oldDisplay?: string, newDisplay?: string) => {
            let oldStr = oldVal?.toString() || '';
            let newStr = newVal?.toString() || '';
            if (field === 'due_date') {
                if (oldVal) oldStr = oldVal.split('T')[0];
                if (newVal) newStr = newVal.split('T')[0];
            }
            if (oldStr !== newStr) {
                changes.push({
                    field: label,
                    old: oldDisplay ?? formatDisplayValue(field, oldVal),
                    new: newDisplay ?? formatDisplayValue(field, newVal),
                });
            }
        };

        checkField('ap_no', 'AP No.', rfp_record.ap_no, data.ap_no);
        checkField('due_date', 'Due Date', rfp_record.due_date, data.due_date);
        checkField('rr_no', 'RR No.', rfp_record.rr_no, data.rr_no);
        checkField('po_no', 'PO No.', rfp_record.po_no, data.po_no);
        checkField('swp_pr_no', 'Requisition No.', rfp_record.swp_pr_no, data.swp_pr_no);
        checkField('swp_rcw_no', 'Contract No.', rfp_record.swp_rcw_no, data.swp_rcw_no);
        checkField('office', 'Office', rfp_record.office, data.office);
        checkField('employee_code', 'Employee Code', rfp_record.employee_code, data.employee_code);
        checkField('employee_name', 'Employee Name', rfp_record.employee_name, data.employee_name);
        checkField('vendor_ref', 'Vendor Ref', rfp_record.vendor_ref, data.vendor_ref);

        // Supplier — show human-readable name instead of raw code
        checkField(
            'supplier_code', 'Supplier',
            rfp_record.supplier_code, data.supplier_code,
            getSupplierLabel(rfp_record.supplier_code, rfp_record.supplier_name),
            getSupplierLabel(data.supplier_code, data.supplier_name),
        );

        // Currency — show code + name instead of raw ID
        checkField(
            'rfp_currency_id', 'Currency',
            rfp_record.rfp_currency_id, data.rfp_currency_id,
            getCurrencyLabel(rfp_record.rfp_currency_id),
            getCurrencyLabel(data.rfp_currency_id),
        );

        checkField('purpose', 'Purpose', rfp_record.purpose, data.purpose);

        // Compare details by usage and amount — label changed to "Category - Usage"
        const oldDetails = rfp_record.details ?? [];
        const newDetails = data.details ?? [];

        const oldDetailsStr = oldDetails
            .map(d => `${d.rfp_usage_id ?? ''}|${Number(d.total_amount ?? 0).toFixed(2)}`)
            .join(';');
        const newDetailsStr = newDetails
            .filter(d => d.rfp_usage_id || d.total_amount)
            .map(d => `${d.rfp_usage_id ?? ''}|${Number(d.total_amount ?? 0).toFixed(2)}`)
            .join(';');

        if (oldDetailsStr !== newDetailsStr) {
            const oldFormatted = oldDetails.length > 0
                ? oldDetails.map(d => {
                    const label = d.usage
                        ? `${d.usage.code} - ${d.usage.description}`
                        : `Usage #${d.rfp_usage_id ?? 'N/A'}`;
                    return `${label} — ${Number(d.total_amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
                }).join(', ')
                : 'N/A';

            const newFiltered = newDetails.filter(d => d.rfp_usage_id || d.total_amount);
            const newFormatted = newFiltered.length > 0
                ? newFiltered.map(d => {
                    const usageList = usagesByCategory[d.rfp_category_id ?? 0] ?? [];
                    const usage = usageList.find(u => u.id === d.rfp_usage_id);
                    const label = usage
                        ? `${usage.code} - ${usage.description}`
                        : `Usage #${d.rfp_usage_id ?? 'N/A'}`;
                    return `${label} — ${Number(d.total_amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
                }).join(', ')
                : 'N/A';

            changes.push({ field: 'Details', old: oldFormatted, new: newFormatted });
        }

        // Compare signatories excluding prepared_by
        // Use deduped values so change log reflects what will actually be saved
        const dedupedSignatories = dedupeSignatories(signatories);
        const oldSigns = rfp_record.signs ?? [];
        const roleLabels: Record<string, string> = {
            prepared_by: 'Prepared By',
            recommending_approval_by: 'Recommending Approval By',
            approved_by: 'Approved By',
            concurred_by: 'Concurred By',
        };

        const oldSignsStr = oldSigns
            .filter(s => s.details !== 'prepared_by')
            .map(s => `${s.details}:${s.user_id}`)
            .sort().join(';');

        const newSignsStr = [
            ...dedupedSignatories.recommending_approval_by.filter(Boolean).map(u => `recommending_approval_by:${u!.value}`),
            ...dedupedSignatories.approved_by.filter(Boolean).map(u => `approved_by:${u!.value}`),
            ...dedupedSignatories.concurred_by.filter(Boolean).map(u => `concurred_by:${u!.value}`),
        ].sort().join(';');

        if (oldSignsStr !== newSignsStr) {
            const formatSigns = (signs: { role: string; name: string }[]) =>
                signs.length > 0
                    ? signs.map(s => `${roleLabels[s.role] ?? s.role}: ${s.name}`).join(', ')
                    : 'N/A';

            const oldFormatted = oldSigns
                .filter(s => s.details !== 'prepared_by')
                .map(s => ({ role: s.details ?? '', name: s.user?.name ?? 'N/A' }));

            const newFormatted = [
                ...dedupedSignatories.recommending_approval_by.filter(Boolean).map(u => ({ role: 'recommending_approval_by', name: u!.label })),
                ...dedupedSignatories.approved_by.filter(Boolean).map(u => ({ role: 'approved_by', name: u!.label })),
                ...dedupedSignatories.concurred_by.filter(Boolean).map(u => ({ role: 'concurred_by', name: u!.label })),
            ];

            changes.push({ field: 'Signatories', old: formatSigns(oldFormatted), new: formatSigns(newFormatted) });
        }

        setDetectedChanges(changes);
    }, [data, signatories, suppliers]);

    const addDetail = () => {
        setData('details', [...data.details, { rfp_category_id: null, rfp_usage_id: null, total_amount: null }]);
    };

    const removeDetail = (index: number) => {
        setData('details', data.details.filter((_, i) => i !== index));
    };

    const updateDetail = (index: number, field: keyof DetailFormItem, value: any) => {
        const updated = [...data.details];
        updated[index] = { ...updated[index], [field]: value };
        setData('details', updated);
    };

    const buildSigns = () => {
        // Dedupe only on save — priority: concurred > approved > recommending
        const deduped = dedupeSignatories(signatories);
        return [
            { user_id: rfp_record.prepared_by?.id ?? auth.user.id, details: 'prepared_by' },
            ...deduped.recommending_approval_by.filter(Boolean).map(u => ({ user_id: u!.value, details: 'recommending_approval_by' })),
            ...deduped.approved_by.filter(Boolean).map(u => ({ user_id: u!.value, details: 'approved_by' })),
            ...deduped.concurred_by.filter(Boolean).map(u => ({ user_id: u!.value, details: 'concurred_by' })),
        ];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (detectedChanges.length > 0) {
            setShowLogDialog(true);
        } else {
            const signs = buildSigns();
            transform(d => ({
                ...d,
                signs,
                details: d.details.map(({ rfp_category_id, ...rest }) => rest),
            }));
            put(`/rfp/records/${rfp_record.id}`, { preserveScroll: true });
        }
    };

    const handleConfirmUpdate = () => {
        if (!logRemarks.trim()) {
            setLogRemarksError(true);
            toast.error('Remarks is required before confirming the update.');
            return;
        }
        setShowLogDialog(false);
        setLogRemarksError(false);
        const signs = buildSigns();
        transform(d => ({
            ...d,
            signs,
            log_remarks: logRemarks.trim().toUpperCase(),
            details: d.details.map(({ rfp_category_id, ...rest }) => rest),
        }));
        put(`/rfp/records/${rfp_record.id}`, { preserveScroll: true });
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`,
    }));

    const currencyOptions = currencies.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`,
    }));

    const userOptions: UserOption[] = users.map(u => ({
        value: u.id,
        label: u.name,
        department: u.department,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/rfp/dashboard' },
                { title: 'Records', href: '/rfp/records' },
                { title: rfp_record.rfp_number, href: `/rfp/records/${rfp_record.id}/edit` },
            ]}
        >
            <Head title={`Edit ${rfp_record.rfp_number}`} />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Edit RFP</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{rfp_record.rfp_number}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                            <a href="/rfp/records">
                                <X className="h-4 w-4 mr-1.5" />
                                Cancel
                            </a>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing || detectedChanges.length === 0}>
                            <Save className="h-4 w-4 mr-1.5" />
                            Update
                        </Button>
                    </div>
                </div>

                {/* Requestor Information */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Requestor Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-sm">Prepared By</Label>
                                <Input
                                    value={rfp_record.prepared_by?.name ?? auth.user.name as string}
                                    className="h-9"
                                    readOnly
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">Department</Label>
                                <Input
                                    value={rfp_record.prepared_by?.department?.department ?? auth.user.department?.department ?? 'N/A'}
                                    className="h-9"
                                    readOnly
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">Status</Label>
                                <div className="h-9 flex items-center">
                                    <RfpBadge type="status" value={rfp_record.status} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-sm">Office <Req /></Label>
                                <SelectUI value={data.office} onValueChange={(v) => setData('office', v as any)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="head_office">Head Office</SelectItem>
                                        <SelectItem value="mine_site">Mine Site</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.office && <p className="text-xs text-destructive">{errors.office}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payee and Document Information */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Payee Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-sm">Type <Req /></Label>
                                <SelectUI value={data.payee_type} onValueChange={(v) => setData('payee_type', v as any)} disabled>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="supplier">Supplier</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.payee_type && <p className="text-xs text-destructive">{errors.payee_type}</p>}
                            </div>

                            {data.payee_type === 'supplier' ? (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Supplier <Req /></Label>
                                        <Select
                                            options={suppliers}
                                            value={
                                                suppliers.find(s => s.value === data.supplier_code)
                                                ?? (data.supplier_code ? { value: data.supplier_code, label: `${data.supplier_code} - ${data.supplier_name}` } : null)
                                            }
                                            onChange={(opt) => {
                                                setData({
                                                    ...data,
                                                    supplier_code: opt?.value || null,
                                                    supplier_name: opt?.label ? opt.label.split(' - ')[1] : null,
                                                } as any);
                                            }}
                                            onMenuOpen={() => !suppliers.length && loadSuppliers()}
                                            isLoading={loadingSuppliers}
                                            isClearable
                                            placeholder="Select supplier..."
                                            className="text-sm"
                                            styles={{
                                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                                menu: (base) => ({ ...base, fontSize: '14px' }),
                                            }}
                                        />
                                        {errors.supplier_code && <p className="text-xs text-destructive">{errors.supplier_code}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="vendor_ref" className="text-sm">Vendor Ref</Label>
                                        <Input
                                            id="vendor_ref"
                                            value={data.vendor_ref}
                                            onChange={(e) => setData('vendor_ref', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="employee_code" className="text-sm">Employee Code <Req /></Label>
                                        <Input
                                            id="employee_code"
                                            value={data.employee_code}
                                            onChange={(e) => setData('employee_code', e.target.value)}
                                            className="h-9"
                                        />
                                        {errors.employee_code && <p className="text-xs text-destructive">{errors.employee_code}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="employee_name" className="text-sm">Employee Name <Req /></Label>
                                        <Input
                                            id="employee_name"
                                            value={data.employee_name}
                                            onChange={(e) => setData('employee_name', e.target.value)}
                                            className="h-9"
                                        />
                                        {errors.employee_name && <p className="text-xs text-destructive">{errors.employee_name}</p>}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Document Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm">Prepared Date</Label>
                                    <Input
                                        value={formatDate(rfp_record.created_at)}
                                        className="h-9"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm">Due Date <Req /></Label>
                                    <DateTimePicker
                                        value={data.due_date}
                                        onValueChange={(date) => setData('due_date', date)}
                                        minDate={today}
                                        placeholder="Select due date"
                                        showTime={false}
                                    />
                                    {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="rr_no" className="text-sm">RR No.</Label>
                                    <Input
                                        id="rr_no"
                                        value={data.rr_no}
                                        onChange={(e) => setData('rr_no', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="po_no" className="text-sm">PO No.</Label>
                                    <Input
                                        id="po_no"
                                        value={data.po_no}
                                        onChange={(e) => setData('po_no', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="swp_pr_no" className="text-sm">SWP PR No.</Label>
                                    <Input
                                        id="swp_pr_no"
                                        value={data.swp_pr_no}
                                        onChange={(e) => setData('swp_pr_no', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="swp_rcw_no" className="text-sm">SWP RCW No.</Label>
                                    <Input
                                        id="swp_rcw_no"
                                        value={data.swp_rcw_no}
                                        onChange={(e) => setData('swp_rcw_no', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Information */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Main Information <Req /></CardTitle>
                            <Button type="button" size="sm" variant="outline" onClick={addDetail}>
                                Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.details.length > 0 && (
                            <div className="hidden md:flex gap-2 px-3 pb-2">
                                <div className="flex-1 grid grid-cols-4 gap-2">
                                    <p className="text-xs font-medium text-muted-foreground">Category</p>
                                    <p className="text-xs font-medium text-muted-foreground">Usage</p>
                                    <p className="text-xs font-medium text-muted-foreground">Currency</p>
                                    <p className="text-xs font-medium text-muted-foreground">Amount</p>
                                </div>
                                {data.details.length > 1 && <div className="w-9"></div>}
                            </div>
                        )}

                        {data.details.map((detail, index) => (
                            <div key={index} className="flex gap-2 items-start px-3">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                                    {/* Category */}
                                    <div className="space-y-1">
                                        <Select
                                            options={categoryOptions}
                                            value={categoryOptions.find(o => o.value === detail.rfp_category_id) ?? null}
                                            onChange={(opt) => {
                                                const updated = [...data.details];
                                                updated[index] = {
                                                    ...updated[index],
                                                    rfp_category_id: opt?.value || null,
                                                    rfp_usage_id: null,
                                                };
                                                setData('details', updated);
                                                if (opt?.value) loadUsagesForCategory(opt.value);
                                            }}
                                            isClearable
                                            placeholder="Select category..."
                                            className="text-sm"
                                            styles={{
                                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                                menu: (base) => ({ ...base, fontSize: '14px' }),
                                            }}
                                        />
                                    </div>
                                    {/* Usage */}
                                    <div className="space-y-1">
                                        <Select
                                            options={(usagesByCategory[detail.rfp_category_id ?? 0] ?? []).map(u => ({
                                                value: u.id,
                                                label: `${u.code} - ${u.description}`,
                                            }))}
                                            value={
                                                (usagesByCategory[detail.rfp_category_id ?? 0] ?? [])
                                                    .map(u => ({ value: u.id, label: `${u.code} - ${u.description}` }))
                                                    .find(o => o.value === detail.rfp_usage_id) ?? null
                                            }
                                            onChange={(opt) => updateDetail(index, 'rfp_usage_id', opt?.value || null)}
                                            isClearable
                                            isDisabled={!detail.rfp_category_id}
                                            placeholder="Select usage..."
                                            className="text-sm"
                                            styles={{
                                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                                menu: (base) => ({ ...base, fontSize: '14px' }),
                                            }}
                                        />
                                        {errors[`details.${index}.rfp_usage_id`] && (
                                            <p className="text-xs text-destructive">{errors[`details.${index}.rfp_usage_id`]}</p>
                                        )}
                                    </div>
                                    {/* Currency */}
                                    <div className="space-y-1">
                                        <Select
                                            options={currencyOptions}
                                            value={currencyOptions.find(o => o.value === data.rfp_currency_id)}
                                            onChange={(opt) => setData('rfp_currency_id', opt?.value || null)}
                                            placeholder="Select currency..."
                                            isDisabled={index !== 0}
                                            className="text-sm"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '36px',
                                                    fontSize: '14px',
                                                    // visually distinguish readonly rows from truly disabled
                                                    opacity: index !== 0 ? 0.6 : 1,
                                                    cursor: index !== 0 ? 'not-allowed' : 'default',
                                                }),
                                                menu: (base) => ({ ...base, fontSize: '14px' }),
                                            }}
                                        />
                                        {index === 0 && errors.rfp_currency_id && (
                                            <p className="text-xs text-destructive">{errors.rfp_currency_id}</p>
                                        )}
                                    </div>
                                    {/* Amount */}
                                    <div className="space-y-1">
                                        <InputAmount
                                            value={detail.total_amount || undefined}
                                            onValueChange={(val) => updateDetail(index, 'total_amount', val || null)}
                                            className="h-9"
                                        />
                                        {errors[`details.${index}.total_amount`] && (
                                            <p className="text-xs text-destructive">{errors[`details.${index}.total_amount`]}</p>
                                        )}
                                    </div>
                                </div>
                                {data.details.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDetail(index)}
                                        className="text-destructive hover:text-destructive h-9 w-9 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {errors['details'] && (
                            <p className="text-xs text-destructive px-3">{errors['details']}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="purpose" className="text-sm">Purpose <Req /></Label>
                                <span className={`text-xs ${data.purpose.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {data.purpose.length} / 1000
                                </span>
                            </div>
                            <Textarea
                                id="purpose"
                                value={data.purpose}
                                onChange={(e) => setData('purpose', e.target.value)}
                                rows={3}
                                className={`resize-none ${data.purpose.length > 1000 ? 'border-destructive' : ''}`}
                            />
                            {data.purpose.length > 1000 && (
                                <p className="text-xs text-destructive">Purpose must not exceed 1000 characters.</p>
                            )}
                            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Signatories */}
                <RfpSignatoriesForm
                    preparedByName={rfp_record.prepared_by?.name ?? auth.user.name as string}
                    signatories={signatories}
                    userOptions={userOptions}
                    onChange={setSignatories}
                    office={data.office}
                    subtotalAmount={data.details.reduce((sum, d) => sum + (Number(d.total_amount ?? 0)), 0)}
                    residentManager={residentManager}
                    departmentHead={departmentHead}
                    cfo={cfo}
                    ceo={ceo}
                />
            </form>

            {/* Change Log Confirmation Dialog */}
            <AlertDialog open={showLogDialog} onOpenChange={(open) => {
                if (!open) setLogRemarksError(false);
                setShowLogDialog(open);
            }}>
                <AlertDialogContent
                    className="p-0 flex flex-col"
                    style={{ width: '72rem', maxWidth: '95vw', maxHeight: '90vh' }}
                >
                    <AlertDialogHeader className="px-6 pt-6 pb-3 shrink-0">
                        <AlertDialogTitle>Confirm Update</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 pt-2">
                                <p>The following changes will be logged:</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="px-6 space-y-3 overflow-y-auto flex-1">
                        <div className="border rounded-lg overflow-y-auto" style={{ maxHeight: '35vh' }}>
                            <table className="w-full text-sm table-fixed">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium w-[25%]">Field</th>
                                        <th className="px-3 py-2 text-left font-medium w-[37.5%]">Old Value</th>
                                        <th className="px-3 py-2 text-left font-medium w-[37.5%]">New Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detectedChanges.map((change, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="px-3 py-2 font-medium align-top">{change.field}</td>
                                            <td className="px-3 py-2 text-muted-foreground align-top wrap-break-word">{change.old}</td>
                                            <td className="px-3 py-2 text-primary align-top wrap-break-word">{change.new}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-1.5 pb-4">
                            <Label htmlFor="log_remarks" className="text-sm">
                                Remarks <span className="text-destructive ml-0.5">*</span>
                            </Label>
                            <Textarea
                                id="log_remarks"
                                value={logRemarks}
                                onChange={(e) => {
                                    setLogRemarks(e.target.value);
                                    if (logRemarksError && e.target.value.trim()) setLogRemarksError(false);
                                }}
                                placeholder="Add any additional notes about these changes..."
                                rows={3}
                                className={`resize-none uppercase ${logRemarksError ? 'border-destructive' : ''}`}
                            />
                            {logRemarksError && (
                                <p className="text-xs text-destructive">Remarks is required.</p>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter className="px-6 py-4 bg-background border-t rounded-b-lg shrink-0">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmUpdate} disabled={processing}>
                            Confirm Update
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
