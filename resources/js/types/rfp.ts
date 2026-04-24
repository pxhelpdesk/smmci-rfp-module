// types/rfp.ts

import type { Department } from './auth';

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

export type RfpUser = {
    id: number;
    first_name: string;
    last_name: string;
    department_id?: number;
    department?: Department;
    name: string;
};

export type UserOption = {
    value: number;
    label: string;
    department?: string;
};

export type RfpRecord = {
    id: number;
    prepared_by?: RfpUser;
    ap_no: string | null;
    due_date: string;
    rr_no: string | null;
    po_no: string | null;
    swp_pr_no: string | null;
    swp_rcw_no: string | null;
    rfp_number: string;
    office: 'head_office' | 'mine_site';
    payee_type: 'employee' | 'supplier';
    employee_code: string | null;
    employee_name: string | null;
    supplier_code: string | null;
    supplier_name: string | null;
    vendor_ref: string | null;
    rfp_currency_id: number;
    currency?: RfpCurrency;
    subtotal_details_amount: number | null;
    purpose: string;
    status: 'cancelled' | 'draft' | 'posted';
    details: RfpDetail[];
    signs?: RfpSign[];
    logs?: RfpLog[];
    supplier?: SapSupplier;
    created_at: string;
    updated_at: string;
};

export type RfpDetail = {
    id?: number;
    rfp_record_id?: number;
    rfp_usage_id: number | null;
    usage?: RfpUsage;
    total_amount: number | null;
};

export type RfpSignatoryRole = 'prepared_by' | 'recommending_approval_by' | 'approved_by' | 'concurred_by';

export type RfpSign = {
    id: number;
    rfp_record_id: number;
    code: string | null;
    user_id: number | null;
    user?: RfpUser;
    is_signed: boolean | null;
    details: RfpSignatoryRole | null;
    remarks: string | null;
    created_at: string;
    updated_at: string;
};

export type RfpLog = {
    id: number;
    rfp_record_id: number;
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

export type RfpDashboardStats = {
    total_records: number;
    total_draft: number;
    total_cancelled: number;
    total_grand_amount: number;
};

// SAP Data Types
export type SapAccountOption = {
    value: string;
    label: string;
};

export type SapSupplierOption = {
    value: string;
    label: string;
};

export type SapSupplier = {
    id: number;
    card_code: string;
    card_name: string;
    address: string | null;
    tin: string | null;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
};
