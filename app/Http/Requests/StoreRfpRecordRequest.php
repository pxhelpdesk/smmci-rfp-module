<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class StoreRfpRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ap_no' => 'nullable|string',
            'due_date' => 'required|date|after_or_equal:today',
            'rr_no' => 'nullable|string',
            'po_no' => 'nullable|string',
            'requisition_no' => 'nullable|string',
            'contract_no' => 'nullable|string',
            'office' => 'required|in:head_office,mine_site',
            'payee_type' => 'required|in:employee,supplier',
            'employee_code' => 'required_if:payee_type,employee|nullable|string',
            'employee_name' => 'required_if:payee_type,employee|nullable|string',
            'supplier_code' => 'required_if:payee_type,supplier|nullable|string',
            'supplier_name' => 'required_if:payee_type,supplier|nullable|string',
            'vendor_ref' => 'nullable|string',
            'rfp_currency_id' => 'required|exists:mysql_rfp.rfp_currencies,id',
            'purpose' => 'required|string',
            'status' => 'nullable|in:cancelled,draft,for_approval,approved,paid',
            'details' => 'required|array|min:1',
            'details.*.rfp_usage_id' => 'required|exists:mysql_rfp.rfp_usages,id',
            'details.*.total_amount' => 'required|numeric|min:0.01',
            'signs' => 'nullable|array',
            'signs.*.user_id' => 'required|integer|exists:mysql.users,id',
            'signs.*.details' => 'required|in:prepared_by,recommending_approval_by,approved_by,concurred_by',
        ];
    }

    public function messages(): array
    {
        return [
            'due_date.after_or_equal' => 'The due date must be today or a future date.',
            'due_date.required' => 'The due date is required.',
            'office.required' => 'The office is required.',
            'payee_type.required' => 'The payee type is required.',
            'employee_code.required_if' => 'Employee code is required.',
            'employee_name.required_if' => 'Employee name is required.',
            'supplier_code.required_if' => 'Supplier is required.',
            'supplier_name.required_if' => 'Supplier name is required.',
            'rfp_currency_id.required' => 'The currency is required.',
            'purpose.required' => 'The purpose is required.',
            'details.required' => 'At least one item is required.',
            'details.min' => 'At least one item is required.',
            'details.*.rfp_usage_id.required' => 'Usage is required for each detail.',
            'details.*.rfp_usage_id.exists' => 'Selected usage is invalid.',
            'details.*.total_amount.required' => 'Amount is required for each detail.',
            'details.*.total_amount.min' => 'Amount must be greater than zero.',
            'signs.*.user_id.required' => 'A user is required for each signatory.',
            'signs.*.details.required' => 'Signatory role is required.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        session()->flash('error', 'Please check the form for errors.');
        parent::failedValidation($validator);
    }

    protected function prepareForValidation()
    {
        // Remove completely empty details (all fields null/empty)
        if ($this->has('details')) {
            $this->merge([
                'details' => collect($this->details)
                    ->filter(function($item) {
                        return !empty($item['rfp_usage_id']) ||
                            !empty($item['total_amount']);
                    })
                    ->values()
                    ->toArray()
            ]);
        }
    }
}
