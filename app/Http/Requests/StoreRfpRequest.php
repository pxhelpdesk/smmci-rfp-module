<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRfpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area' => 'nullable|in:Head Office,Mine Site',
            'rfp_form_id' => 'nullable|exists:rfp_forms,id',
            'payee_type' => 'nullable|in:Employee,Supplier',
            'payee_card_code' => 'nullable|string',
            'requested_by' => 'nullable|exists:users,id',
            'recommended_by' => 'nullable|exists:users,id',
            'approved_by' => 'nullable|exists:users,id',
            'concurred_by' => 'nullable|exists:users,id',
            'payee_invoice_number' => 'nullable|string',
            'gross_amount' => 'nullable|numeric',
            'is_vatable' => 'nullable|boolean',
            'vat_type' => 'nullable|in:Inclusive,Exclusive',
            'down_payment' => 'nullable|numeric',
            'currency' => 'nullable|in:Peso,US Dollar',
            'remarks' => 'nullable|string',
            'due_date' => 'nullable|date',
            'shared_description_id' => 'nullable|exists:shared_descriptions,id',
            'purpose' => 'nullable|string',
            'status' => 'nullable|in:Draft,Cancelled,Final,Final with CV,Paid',
            'voucher_number' => 'nullable|string',
            'check_number' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.account_code' => 'nullable|string',
            'items.*.payment_type' => 'nullable|string',
            'items.*.billed_amount' => 'nullable|numeric',
        ];
    }
}
