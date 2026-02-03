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
import type { Rfp, RfpForm, SharedDescription, RfpUser, SapAccount, SapSupplier, RfpItem } from '@/types';

type Props = {
    rfp: Rfp;
    rfpForms: RfpForm[];
    sharedDescriptions: SharedDescription[];
    users: RfpUser[];
};

export default function Edit({ rfp, rfpForms, sharedDescriptions, users }: Props) {
    const [accounts, setAccounts] = useState<SapAccount[]>([]);
    const [suppliers, setSuppliers] = useState<SapSupplier[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        area: rfp.area,
        rfp_form_id: rfp.rfp_form_id,
        payee_type: rfp.payee_type,
        payee_card_code: rfp.payee_card_code,
        payee_card_name: rfp.payee_card_name || '',
        payee_invoice_number: rfp.payee_invoice_number || '',
        requested_by: rfp.requested_by,
        recommended_by: rfp.recommended_by,
        approved_by: rfp.approved_by,
        concurred_by: rfp.concurred_by,
        total_before_vat: rfp.total_before_vat?.toString() || '',
        is_vatable: rfp.is_vatable,
        vat_type: rfp.vat_type,
        down_payment: rfp.down_payment?.toString() || '',
        withholding_tax: rfp.withholding_tax?.toString() || '',
        currency: rfp.currency,
        remarks: rfp.remarks || '',
        due_date: rfp.due_date || '',
        shared_description_id: rfp.shared_description_id,
        purpose: rfp.purpose || '',
        status: rfp.status,
        voucher_number: rfp.voucher_number || '',
        check_number: rfp.check_number || '',
        items: rfp.items.map(item => ({
            id: item.id,
            account_code: item.account_code,
            account_name: item.account_name,
            payment_type: item.payment_type,
            billed_amount: item.billed_amount,
        })) as Partial<RfpItem>[],
    });

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        try {
            const res = await fetch('/rfp/api/accounts');
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to load accounts', error);
        }
        setLoadingAccounts(false);
    };

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

    const addItem = () => {
        setData('items', [...data.items, { account_code: null, payment_type: '', billed_amount: null }]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof RfpItem, value: any) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [field]: value };
        setData('items', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/rfp/requests/${rfp.id}`);
    };

    const rfpFormOptions = rfpForms.map(f => ({
        value: f.id,
        label: `${f.code} - ${f.description}`,
    }));

    const sharedDescOptions = sharedDescriptions.map(s => ({
        value: s.id,
        label: `${s.code} - ${s.description}`,
    }));

    const userOptions = users.map(u => ({
        value: u.id,
        label: `${u.first_name} ${u.last_name}${u.department ? ` - ${u.department.department}` : ''}`,
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Requests', href: '/rfp/requests' },
                { title: rfp.rfp_number, href: `/rfp/requests/${rfp.id}/edit` },
            ]}
        >
            <Head title={`Edit ${rfp.rfp_number}`} />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Edit RFP Request</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {rfp.rfp_number}
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
                            Update
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="area" className="text-sm">Area</Label>
                                <SelectUI value={data.area} onValueChange={(v) => setData('area', v as any)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Head Office">Head Office</SelectItem>
                                        <SelectItem value="Mine Site">Mine Site</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm">RFP Form</Label>
                                <Select
                                    options={rfpFormOptions}
                                    value={rfpFormOptions.find(o => o.value === data.rfp_form_id)}
                                    onChange={(opt) => setData('rfp_form_id', opt?.value || null)}
                                    isClearable
                                    placeholder="Select form..."
                                    className="text-sm"
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                        menu: (base) => ({ ...base, fontSize: '14px' }),
                                    }}
                                />
                                {errors.rfp_form_id && <p className="text-xs text-destructive">{errors.rfp_form_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm">Shared Description</Label>
                                <Select
                                    options={sharedDescOptions}
                                    value={sharedDescOptions.find(o => o.value === data.shared_description_id)}
                                    onChange={(opt) => setData('shared_description_id', opt?.value || null)}
                                    isClearable
                                    placeholder="Select description..."
                                    className="text-sm"
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                        menu: (base) => ({ ...base, fontSize: '14px' }),
                                    }}
                                />
                                {errors.shared_description_id && <p className="text-xs text-destructive">{errors.shared_description_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-sm">Status</Label>
                                <SelectUI value={data.status} onValueChange={(v) => setData('status', v as any)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        <SelectItem value="Final">Final</SelectItem>
                                        <SelectItem value="Final with CV">Final with CV</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Payee Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="payee_type" className="text-sm">Type</Label>
                                <SelectUI value={data.payee_type} onValueChange={(v) => setData('payee_type', v as any)}>
                                    <SelectTrigger className="h-9" disabled>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                        <SelectItem value="Supplier">Supplier</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.payee_type && <p className="text-xs text-destructive">{errors.payee_type}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm">Supplier</Label>
                                <Select
                                    options={suppliers}
                                    value={suppliers.find(s => s.value === data.payee_card_code)}
                                    onChange={(opt) => {
                                        const updated = {
                                            ...data,
                                            payee_card_code: opt?.value || null,
                                            payee_card_name: opt ? opt.label.split(' - ')[1] : null,
                                        };
                                        setData(updated as any);
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
                                {errors.payee_card_code && <p className="text-xs text-destructive">{errors.payee_card_code}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="payee_invoice_number" className="text-sm">Invoice Number</Label>
                                <Input
                                    id="payee_invoice_number"
                                    value={data.payee_invoice_number}
                                    onChange={(e) => setData('payee_invoice_number', e.target.value)}
                                    className="h-9"
                                />
                                {errors.payee_invoice_number && <p className="text-xs text-destructive">{errors.payee_invoice_number}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Items</CardTitle>
                            <Button type="button" size="sm" variant="outline" onClick={addItem}>
                                Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <Select
                                        options={accounts}
                                        value={accounts.find(a => a.value === item.account_code)}
                                        onChange={(opt) => {
                                            const updated = [...data.items];
                                            updated[index] = {
                                                ...updated[index],
                                                account_code: opt?.value || null,
                                                account_name: opt ? opt.label.split(' - ')[1] : null,
                                            };
                                            setData('items', updated);
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
                                    />
                                    <Input
                                        placeholder="Payment type"
                                        value={item.payment_type || ''}
                                        onChange={(e) => updateItem(index, 'payment_type', e.target.value)}
                                        className="h-9"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Amount"
                                        value={item.billed_amount || ''}
                                        onChange={(e) => updateItem(index, 'billed_amount', parseFloat(e.target.value) || null)}
                                        className="h-9"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {data.items.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No items added yet. Click "Add Item" to begin.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Financial Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="currency" className="text-sm">Currency</Label>
                                <SelectUI value={data.currency} onValueChange={(v) => setData('currency', v as any)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Peso">Peso</SelectItem>
                                        <SelectItem value="US Dollar">US Dollar</SelectItem>
                                    </SelectContent>
                                </SelectUI>
                                {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="total_before_vat" className="text-sm">Total Before VAT</Label>
                                <Input
                                    id="total_before_vat"
                                    type="number"
                                    step="0.01"
                                    value={data.total_before_vat}
                                    onChange={(e) => setData('total_before_vat', e.target.value)}
                                    className="h-9"
                                />
                                {errors.total_before_vat && <p className="text-xs text-destructive">{errors.total_before_vat}</p>}
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
                                                <SelectItem value="Inclusive">Inclusive</SelectItem>
                                                <SelectItem value="Exclusive">Exclusive</SelectItem>
                                            </SelectContent>
                                        </SelectUI>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="down_payment" className="text-sm">Down Payment</Label>
                                <Input
                                    id="down_payment"
                                    type="number"
                                    step="0.01"
                                    value={data.down_payment}
                                    onChange={(e) => setData('down_payment', e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="withholding_tax" className="text-sm">Withholding Tax</Label>
                                <Input
                                    id="withholding_tax"
                                    type="number"
                                    step="0.01"
                                    value={data.withholding_tax}
                                    onChange={(e) => setData('withholding_tax', e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="due_date" className="text-sm">Due Date</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="h-9"
                                />
                                {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Signers</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm">Requested By</Label>
                            <Select
                                options={userOptions}
                                value={userOptions.find(u => u.value === data.requested_by)}
                                onChange={(opt) => setData('requested_by', opt?.value || null)}
                                isClearable
                                placeholder="Select user..."
                                className="text-sm"
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                    menu: (base) => ({ ...base, fontSize: '14px' }),
                                }}
                            />
                            {errors.requested_by && <p className="text-xs text-destructive">{errors.requested_by}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm">Recommended By</Label>
                            <Select
                                options={userOptions}
                                value={userOptions.find(u => u.value === data.recommended_by)}
                                onChange={(opt) => setData('recommended_by', opt?.value || null)}
                                isClearable
                                placeholder="Select user..."
                                className="text-sm"
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                    menu: (base) => ({ ...base, fontSize: '14px' }),
                                }}
                            />
                            {errors.recommended_by && <p className="text-xs text-destructive">{errors.recommended_by}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm">Approved By</Label>
                            <Select
                                options={userOptions}
                                value={userOptions.find(u => u.value === data.approved_by)}
                                onChange={(opt) => setData('approved_by', opt?.value || null)}
                                isClearable
                                placeholder="Select user..."
                                className="text-sm"
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                    menu: (base) => ({ ...base, fontSize: '14px' }),
                                }}
                            />
                            {errors.approved_by && <p className="text-xs text-destructive">{errors.approved_by}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm">Concurred By</Label>
                            <Select
                                options={userOptions}
                                value={userOptions.find(u => u.value === data.concurred_by)}
                                onChange={(opt) => setData('concurred_by', opt?.value || null)}
                                isClearable
                                placeholder="Select user..."
                                className="text-sm"
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
                                    menu: (base) => ({ ...base, fontSize: '14px' }),
                                }}
                            />
                            {errors.concurred_by && <p className="text-xs text-destructive">{errors.concurred_by}</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="voucher_number" className="text-sm">Voucher Number</Label>
                                <Input
                                    id="voucher_number"
                                    value={data.voucher_number}
                                    onChange={(e) => setData('voucher_number', e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="check_number" className="text-sm">Check Number</Label>
                                <Input
                                    id="check_number"
                                    value={data.check_number}
                                    onChange={(e) => setData('check_number', e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="purpose" className="text-sm">Purpose</Label>
                                <Textarea
                                    id="purpose"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="remarks" className="text-sm">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
}
