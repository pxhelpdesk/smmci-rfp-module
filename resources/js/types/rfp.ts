// types/rfp.ts

export type Department = {
    id: number;
    department: string;
};

export type RfpUser = {
    id: number;
    first_name: string;
    last_name: string;
    department_id?: number;
    department?: Department;
    name: string;
};

export type RfpCurrency = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
};

export type RfpCategory = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
};

export type RfpUsage = {
    id: number;
    rfp_category_id: number;
    category?: RfpCategory;
    code: string;
    description: string;
    is_active: boolean;
};

export type RfpDetail = {
    id?: number;
    rfp_id?: number;
    account_code: string | null;
    account_name: string | null;
    description: string | null;
    total_amount: number | null;
};

export type RfpSign = {
    id: number;
    rfp_id: number;
    code: string | null;
    user_id: number | null;
    user?: RfpUser;
    is_signed: boolean;
    details: string | null;
    remarks: string | null;
    created_at: string;
    updated_at: string;
};

export type RfpLog = {
    id: number;
    rfp_id: number;
    code: string | null;
    user_id: number | null;
    user?: RfpUser;
    from: string | null;
    into: string | null;
    details: string | null;
    remarks: string | null;
    created_at: string;
    updated_at: string;
};

export type Rfp = {
    id: number;
    ap_no: string | null;
    due_date: string;
    rr_no: string | null;
    po_no: string | null;
    rfp_number: string;
    area: 'Head Office' | 'Mine Site';
    payee_type: 'Employee' | 'Supplier';
    employee_code: string | null;
    employee_name: string | null;
    supplier_code: string | null;
    supplier_name: string | null;
    vendor_ref: string | null;
    rfp_currency_id: number;
    currency?: RfpCurrency;
    rfp_usage_id: number;
    usage?: RfpUsage;
    total_before_vat_amount: number | null;
    less_down_payment_amount: number | null;
    is_vatable: boolean;
    vat_type: 'inclusive' | 'exclusive';
    vat_amount: number | null;
    wtax_amount: number | null;
    grand_total_amount: number | null;
    remarks: string | null;
    status: 'cancelled' | 'draft' | 'for_approval' | 'approved' | 'paid';
    details: RfpDetail[];
    signs?: RfpSign[];
    logs?: RfpLog[];
    created_at: string;
    updated_at: string;
};

export type SapAccount = {
    value: string;
    label: string;
};

export type SapSupplier = {
    value: string;
    label: string;
};
