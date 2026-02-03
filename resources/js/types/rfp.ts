export type RfpForm = {
    id: number;
    code: string;
    description: string;
};

export type SharedDescription = {
    id: number;
    code: string;
    description: string;
};

export type Department = {
    id: number;
    name: string;
};

export type RfpUser = {
    id: number;
    first_name: string;
    last_name: string;
    department_id?: number;
    department?: Department;
    name: string;
};

export type RfpItem = {
    id?: number;
    rfp_id?: number;
    account_code: string | null;
    payment_type: string | null;
    billed_amount: number | null;
};

export type Rfp = {
    id: number;
    rfp_number: string;
    area: 'Head Office' | 'Mine Site';
    rfp_form_id: number | null;
    rfp_form?: RfpForm;
    payee_type: 'Employee' | 'Supplier';
    payee_card_code: string | null;
    requested_by: number | null;
    requested_by_user?: RfpUser;
    recommended_by: number | null;
    recommended_by_user?: RfpUser;
    approved_by: number | null;
    approved_by_user?: RfpUser;
    concurred_by: number | null;
    concurred_by_user?: RfpUser;
    payee_invoice_number: string | null;
    subtotal: number | null;
    gross_amount: number | null;
    is_vatable: boolean;
    vat_type: 'Inclusive' | 'Exclusive';
    down_payment: number | null;
    vat_amount: number | null;
    withholding_tax: number | null;
    grand_total: number | null;
    currency: 'Peso' | 'US Dollar';
    remarks: string | null;
    due_date: string | null;
    shared_description_id: number | null;
    shared_description?: SharedDescription;
    purpose: string | null;
    status: 'Draft' | 'Cancelled' | 'Final' | 'Final with CV' | 'Paid';
    voucher_number: string | null;
    check_number: string | null;
    items: RfpItem[];
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
