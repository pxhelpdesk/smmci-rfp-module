import { useForm, Head, usePage } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { useState } from 'react';
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
import type { RfpCategory, RfpUsage, RfpCurrency, UserOption, SapSupplierOption, SharedData } from '@/types';
import { RfpSignatoriesForm, type SignatoriesState, dedupeSignatories } from '@/components/rfp/rfp-signatories-form';
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

type DetailFormItem = {
    rfp_category_id: number | null;
    rfp_usage_id: number | null;
    total_amount: number | null;
};

type Props = {
    categories: RfpCategory[];
    currencies: RfpCurrency[];
    defaultCurrencyId?: number | null;
    users: { id: number; name: string; department?: string }[];
    scopeOwner?: { id: number; name: string; department?: string } | null;
    departmentHead?: { id: number; name: string; department?: string } | null;
    residentManager?: { id: number; name: string; department?: string } | null;
    cfo?: { id: number; name: string; department?: string } | null;
    ceo?: { id: number; name: string; department?: string } | null;
};

const Req = () => <span className="text-destructive ml-0.5">*</span>;

export default function Create({ categories, currencies, defaultCurrencyId, users, scopeOwner, departmentHead, residentManager, cfo, ceo }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [suppliers, setSuppliers] = useState<SapSupplierOption[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [createRemarks, setCreateRemarks] = useState('');

    // Per-category usage cache to support per-row category+usage selection
    const [usagesByCategory, setUsagesByCategory] = useState<Record<number, RfpUsage[]>>({});

    const [signatories, setSignatories] = useState<SignatoriesState>(() => {
        const approvedDefaults: UserOption[] = [];
        const addedIds = new Set<number>();

        const pushIfNew = (u: { id: number; name: string; department?: string }) => {
            if (addedIds.has(u.id)) return;
            addedIds.add(u.id);
            approvedDefaults.push({ value: u.id, label: u.name, department: u.department });
        };

        // Default office is 'mine_site' on create
        if (residentManager) pushIfNew(residentManager);
        if (departmentHead) pushIfNew(departmentHead);
        // cfo/ceo not added initially since amount starts at 0

        // Return raw — do NOT dedupe here so the form can show duplicate warnings visually
        return {
            recommending_approval_by: scopeOwner
                ? [{ value: scopeOwner.id, label: scopeOwner.name, department: scopeOwner.department }]
                : [],
            approved_by: approvedDefaults,
            concurred_by: users
                .filter(u => u.id === 4 || u.id === 3)
                .sort((a, b) => (a.id === 4 ? -1 : 1))
                .map(u => ({ value: u.id, label: u.name, department: u.department })),
        };
    });

    const { data, setData, post, processing, errors, transform } = useForm<{
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
        log_remarks: string;
    }>({
        ap_no: '',
        due_date: '',
        rr_no: '',
        po_no: '',
        swp_pr_no: '',
        swp_rcw_no: '',
        office: 'mine_site',
        payee_type: 'supplier',
        employee_code: '',
        employee_name: '',
        supplier_code: null,
        supplier_name: null,
        vendor_ref: '',
        rfp_currency_id: defaultCurrencyId ?? null,
        purpose: '',
        details: [{ rfp_category_id: null, rfp_usage_id: null, total_amount: null }],
        signs: [],
        log_remarks: '',
    });

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmDialog(true);
    };

    const handleConfirmCreate = () => {
        setShowConfirmDialog(false);
        // Dedupe only on save — priority: concurred > approved > recommending
        const deduped = dedupeSignatories(signatories);
        transform(d => ({
            ...d,
            signs: [
                { user_id: auth.user.id, details: 'prepared_by' },
                ...deduped.recommending_approval_by.filter(Boolean).map(u => ({ user_id: u!.value, details: 'recommending_approval_by' })),
                ...deduped.approved_by.filter(Boolean).map(u => ({ user_id: u!.value, details: 'approved_by' })),
                ...deduped.concurred_by.filter(Boolean).map(u => ({ user_id: u!.value, details: 'concurred_by' })),
            ],
            details: d.details.map(({ rfp_category_id, ...rest }) => rest),
            log_remarks: createRemarks,
        }));
        post('/rfp/records');
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
                { title: 'Create', href: '/rfp/records/create' },
            ]}
        >
            <Head title="Create RFP" />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Create RFP</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below</p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                            <a href="/rfp/records">
                                <X className="h-4 w-4 mr-1.5" />
                                Cancel
                            </a>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="h-4 w-4 mr-1.5" />
                            Save
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
                                <Input value={auth.user.name as string} className="h-9" readOnly />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">Department</Label>
                                <Input value={auth.user.department?.department ?? 'N/A'} className="h-9" readOnly />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">Status</Label>
                                <Input value="Draft" className="h-9" readOnly />
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
                                            value={suppliers.find(s => s.value === data.supplier_code)}
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
                                    <Input value={formatDate(new Date().toISOString())} className="h-9" readOnly />
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

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Create RFP</AlertDialogTitle>
                            <AlertDialogDescription>
                                Review your entry before saving. You may add remarks below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="space-y-1.5 px-0">
                            <Label htmlFor="create_remarks" className="text-sm">
                                Remarks <span className="text-muted-foreground">(Optional)</span>
                            </Label>
                            <Textarea
                                id="create_remarks"
                                value={createRemarks}
                                onChange={(e) => setCreateRemarks(e.target.value)}
                                placeholder="Add any notes about this RFP..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmCreate} disabled={processing}>
                                Save RFP
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Signatories */}
                <RfpSignatoriesForm
                    preparedByName={auth.user.name as string}
                    signatories={signatories}
                    userOptions={userOptions}
                    onChange={setSignatories}
                    office={data.office}
                    subtotalAmount={data.details.reduce((sum, d) => sum + (d.total_amount ?? 0), 0)}
                    residentManager={residentManager}
                    departmentHead={departmentHead}
                    cfo={cfo}
                    ceo={ceo}
                />
            </form>
        </AppLayout>
    );
}
