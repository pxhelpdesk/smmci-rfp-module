import { useForm, Head } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { useState } from 'react';
import Select from 'react-select';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { RfpCategory, RfpUsage, RfpCurrency, RfpDetail, SapAccountOption, SapSupplierOption } from '@/types';

type Props = {
    categories: RfpCategory[];
    currencies: RfpCurrency[];
    defaultCurrencyId?: number | null;
};

const Req = () => <span className="text-destructive ml-0.5">*</span>;

export default function Create({ categories, currencies, defaultCurrencyId }: Props) {
    const [accounts, setAccounts] = useState<SapAccountOption[]>([]);
    const [suppliers, setSuppliers] = useState<SapSupplierOption[]>([]);
    const [usages, setUsages] = useState<RfpUsage[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingUsages, setLoadingUsages] = useState(false);
    const [usageSelectKey, setUsageSelectKey] = useState(0);

    const { data, setData, post, processing, errors } = useForm<{
        ap_no: string;
        due_date: string;
        rr_no: string;
        po_no: string;
        swp_pr_no: string;
        contract_no: string;
        area: 'head_office' | 'mine_site';
        payee_type: 'employee' | 'supplier';
        employee_code: string;
        employee_name: string;
        supplier_code: string | null;
        supplier_name: string | null;
        vendor_ref: string;
        rfp_currency_id: number | null;
        rfp_usage_id: number | null;
        rfp_category_id: number | null;
        total_before_vat_amount: string;
        less_down_payment_amount: string;
        is_vatable: boolean;
        vat_type: 'inclusive' | 'exclusive';
        vat_amount: string;
        wtax_amount: string;
        grand_total_amount: string;
        remarks: string;
        details: Partial<RfpDetail>[];
    }>({
        ap_no: '',
        due_date: '',
        rr_no: '',
        po_no: '',
        swp_pr_no: '',
        contract_no: '',
        area: 'mine_site',
        payee_type: 'supplier',
        employee_code: '',
        employee_name: '',
        supplier_code: null,
        supplier_name: null,
        vendor_ref: '',
        rfp_currency_id: defaultCurrencyId ?? null,
        rfp_usage_id: null,
        rfp_category_id: null,
        total_before_vat_amount: '',
        less_down_payment_amount: '',
        is_vatable: true,
        vat_type: 'inclusive',
        vat_amount: '',
        wtax_amount: '',
        grand_total_amount: '',
        remarks: '',
        details: [{
            account_code: null,
            account_name: null,
            description: null,
            total_amount: null
        }],
    });

    // const loadAccounts = async () => {
    //     setLoadingAccounts(true);
    //     try {
    //         const res = await fetch('/rfp/api/accounts');
    //         const data = await res.json();
    //         setAccounts(data);
    //     } catch (error) {
    //         console.error('Failed to load accounts', error);
    //     }
    //     setLoadingAccounts(false);
    // };

    const loadSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const res = await fetch('/rfp/api/suppliers');
            const data = await res.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Failed to load suppliers', error);
        }
        setLoadingSuppliers(false);
    };

    const loadUsages = async (categoryId: number) => {
        setLoadingUsages(true);
        try {
            const res = await fetch(`/rfp/usages/category/${categoryId}`);
            const data = await res.json();
            setUsages(data);
        } catch (error) {
            console.error('Failed to load usages', error);
        }
        setLoadingUsages(false);
    };

    const addDetail = () => {
        setData('details', [...data.details, {
            account_code: null,
            account_name: null,
            description: null,
            total_amount: null
        }]);
    };

    const removeDetail = (index: number) => {
        setData('details', data.details.filter((_, i) => i !== index));
    };

    const updateDetail = (index: number, field: keyof RfpDetail, value: any) => {
        const updated = [...data.details];
        updated[index] = { ...updated[index], [field]: value };
        setData('details', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/rfp/requests');
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`,
    }));

    const usageOptions = usages.map(u => ({
        value: u.id,
        label: `${u.code} - ${u.description}`,
    }));

    const currencyOptions = currencies.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Requests', href: '/rfp/requests' },
                { title: 'Create', href: '/rfp/requests/create' },
            ]}
        >
            <Head title="Create RFP Request" />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Create RFP Request</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Fill in the details below
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                            <a href="/rfp/requests">
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

                {/* Row 1: Basic Information (3 cols) */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="area" className="text-sm">Area <Req /></Label>
                                <SelectUI value={data.area} onValueChange={(v) => setData('area', v as any)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="head_office">Head Office</SelectItem>
                                        <SelectItem value="mine_site">Mine Site</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm">Category <Req /></Label>
                                <Select
                                    options={categoryOptions}
                                    value={categoryOptions.find(o => o.value === data.rfp_category_id)}
                                    onChange={(opt) => {
                                        const categoryId = opt?.value ?? null;

                                        // Only reset if category actually changed
                                        if (categoryId !== data.rfp_category_id) {
                                            setData('rfp_usage_id', null);
                                            setUsages([]);
                                            setUsageSelectKey((k) => k + 1);
                                        }

                                        setData('rfp_category_id', categoryId);

                                        if (categoryId) {
                                            loadUsages(categoryId);
                                        }
                                    }}
                                    isClearable
                                    placeholder="Select category..."
                                    className="text-sm"
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                        menu: (base) => ({ ...base, fontSize: '14px' }),
                                    }}
                                />
                                {errors.rfp_category_id && <p className="text-xs text-destructive">{errors.rfp_category_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm">Usage <Req /></Label>
                                <Select
                                    key={usageSelectKey}
                                    options={usageOptions}
                                    value={usageOptions.find(o => o.value === data.rfp_usage_id)}
                                    onChange={(opt) => setData('rfp_usage_id', opt?.value || null)}
                                    isClearable
                                    isDisabled={!data.rfp_category_id || loadingUsages}
                                    isLoading={loadingUsages}
                                    placeholder="Select usage..."
                                    className="text-sm"
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                        menu: (base) => ({ ...base, fontSize: '14px' }),
                                    }}
                                />
                                {errors.rfp_usage_id && <p className="text-xs text-destructive">{errors.rfp_usage_id}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Row 2: Payee Information (col 1) + Document Information (col 2) */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Payee Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Payee Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="payee_type" className="text-sm">Type <Req /></Label>
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
                                        <Label htmlFor="vendor_ref" className="text-sm">Vendor Reference</Label>
                                        <Input
                                            id="vendor_ref"
                                            value={data.vendor_ref}
                                            onChange={(e) => setData('vendor_ref', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Currency <Req /></Label>
                                        <Select
                                            options={currencyOptions}
                                            value={currencyOptions.find(o => o.value === data.rfp_currency_id)}
                                            onChange={(opt) => setData('rfp_currency_id', opt?.value || null)}
                                            placeholder="Select currency..."
                                            className="text-sm"
                                            styles={{
                                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                                menu: (base) => ({ ...base, fontSize: '14px' }),
                                            }}
                                        />
                                        {errors.rfp_currency_id && <p className="text-xs text-destructive">{errors.rfp_currency_id}</p>}
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

                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Currency <Req /></Label>
                                        <Select
                                            options={currencyOptions}
                                            value={currencyOptions.find(o => o.value === data.rfp_currency_id)}
                                            onChange={(opt) => setData('rfp_currency_id', opt?.value || null)}
                                            placeholder="Select currency..."
                                            className="text-sm"
                                            styles={{
                                                control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                                menu: (base) => ({ ...base, fontSize: '14px' }),
                                            }}
                                        />
                                        {errors.rfp_currency_id && <p className="text-xs text-destructive">{errors.rfp_currency_id}</p>}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Document Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Document Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ap_no" className="text-sm">AP No.</Label>
                                <Input
                                    id="ap_no"
                                    value={data.ap_no}
                                    onChange={(e) => setData('ap_no', e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm">Prepared Date</Label>
                                    <Input
                                        value={formatDate(new Date().toISOString())}
                                        className="h-9"
                                        readOnly
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="due_date" className="text-sm">Due Date <Req /></Label>
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
                                    <Label htmlFor="contract_no" className="text-sm">Contract No.</Label>
                                    <Input
                                        id="contract_no"
                                        value={data.contract_no}
                                        onChange={(e) => setData('contract_no', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Details <Req /></CardTitle>
                            <Button type="button" size="sm" variant="outline" onClick={addDetail}>
                                Add Detail
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.details.length > 0 && (
                            <div className="flex gap-2 px-3 pb-2">
                                {/* <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2"> */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* <p className="text-xs font-medium text-muted-foreground">Account</p> */}
                                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                                </div>
                                {data.details.length > 1 && <div className="w-9"></div>}
                            </div>
                        )}

                        {data.details.map((detail, index) => (
                            <div key={index} className="flex gap-2 items-start px-3">
                                {/* <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2"> */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* <Select
                                        options={accounts}
                                        value={accounts.find(a => a.value === detail.account_code)}
                                        onChange={(opt) => {
                                            const updated = [...data.details];
                                            updated[index] = {
                                                ...updated[index],
                                                account_code: opt?.value || null,
                                                account_name: opt ? opt.label.split(' - ')[1] : null,
                                            };
                                            setData('details', updated);
                                        }}
                                        onMenuOpen={() => !accounts.length && loadAccounts()}
                                        isLoading={loadingAccounts}
                                        isClearable
                                        placeholder="Select account..."
                                        className="text-sm"
                                        styles={{
                                            control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                            menu: (base) => ({ ...base, fontSize: '14px' }),
                                        }}
                                    /> */}
                                    <div className="space-y-1">
                                        <Input
                                            placeholder="Input here"
                                            value={detail.description || ''}
                                            onChange={(e) => updateDetail(index, 'description', e.target.value)}
                                            className="h-9"
                                        />
                                        {errors[`details.${index}.description`] && (
                                            <p className="text-xs text-destructive">
                                                {errors[`details.${index}.description`]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <InputAmount
                                            value={detail.total_amount || undefined}
                                            onValueChange={(val) => updateDetail(index, 'total_amount', val || null)}
                                            className="h-9"
                                        />
                                        {errors[`details.${index}.total_amount`] && (
                                            <p className="text-xs text-destructive">
                                                {errors[`details.${index}.total_amount`]}
                                            </p>
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

                {/* Financial Details */}
                {/* <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Financial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="total_before_vat_amount" className="text-sm">Total Before VAT</Label>
                                <InputAmount
                                    value={data.total_before_vat_amount || undefined}
                                    onValueChange={(val) => setData('total_before_vat_amount', val?.toString() || '')}
                                    className="h-9"
                                />
                                {errors.total_before_vat_amount && <p className="text-xs text-destructive">{errors.total_before_vat_amount}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="less_down_payment_amount" className="text-sm">Down Payment</Label>
                                <InputAmount
                                    value={data.less_down_payment_amount || undefined}
                                    onValueChange={(val) => setData('less_down_payment_amount', val?.toString() || '')}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm">Vatable</Label>
                                <div className="flex items-center gap-3 h-9">
                                    <Checkbox
                                        id="is_vatable"
                                        checked={data.is_vatable}
                                        onCheckedChange={(checked) => setData('is_vatable', checked as boolean)}
                                    />
                                    {data.is_vatable && (
                                        <SelectUI value={data.vat_type} onValueChange={(v) => setData('vat_type', v as any)}>
                                            <SelectTrigger className="h-9 flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="inclusive">Inclusive</SelectItem>
                                                <SelectItem value="exclusive">Exclusive</SelectItem>
                                            </SelectContent>
                                        </SelectUI>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="vat_amount" className="text-sm">VAT Amount</Label>
                                <Input
                                    id="vat_amount"
                                    type="number"
                                    step="0.01"
                                    value={data.vat_amount}
                                    onChange={(e) => setData('vat_amount', e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="wtax_amount" className="text-sm">Withholding Tax</Label>
                                <InputAmount
                                    value={data.wtax_amount || undefined}
                                    onValueChange={(val) => setData('wtax_amount', val?.toString() || '')}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="grand_total_amount" className="text-sm">Grand Total</Label>
                                <InputAmount
                                    value={data.grand_total_amount || undefined}
                                    onValueChange={(val) => setData('grand_total_amount', val?.toString() || '')}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card> */}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            <Label htmlFor="remarks" className="text-sm">Remarks</Label>
                            <Textarea
                                id="remarks"
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
}
