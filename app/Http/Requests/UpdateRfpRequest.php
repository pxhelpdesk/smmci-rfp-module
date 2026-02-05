<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;

class UpdateRfpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ap_no' => 'nullable|string',
            'due_date' => 'required|date|after:today',
            'rr_no' => 'nullable|string',
            'po_no' => 'nullable|string',
            'area' => 'required|in:Head Office,Mine Site',
            'payee_type' => 'required|in:Employee,Supplier',
            'employee_code' => 'nullable|string',
            'employee_name' => 'nullable|string',
            'supplier_code' => 'nullable|string',
            'supplier_name' => 'nullable|string',
            'vendor_ref' => 'nullable|string',
            'rfp_currency_id' => 'required|exists:mysql_rfp.rfp_currencies,id',
            'rfp_usage_id' => 'required|exists:mysql_rfp.rfp_usages,id',
            'total_before_vat_amount' => 'nullable|numeric',
            'less_down_payment_amount' => 'nullable|numeric',
            'is_vatable' => 'nullable|boolean',
            'vat_type' => 'nullable|in:inclusive,exclusive',
            'vat_amount' => 'nullable|numeric',
            'wtax_amount' => 'nullable|numeric',
            'grand_total_amount' => 'nullable|numeric',
            'remarks' => 'nullable|string',
            'status' => 'nullable|in:cancelled,draft,for_approval,approved,paid',
            'log_remarks' => 'nullable|string|max:500',
            'details' => 'required|array|min:1',
            'details.*.id' => 'sometimes|exists:mysql_rfp.rfp_details,id',
            'details.*.account_code' => 'nullable|string',
            'details.*.account_name' => 'nullable|string',
            'details.*.description' => 'required|string',
            'details.*.total_amount' => 'required|numeric|min:0.01',
        ];
    }

    public function messages(): array
    {
        return [
            'due_date.after' => 'The due date must be a future date.',
            'due_date.required' => 'The due date is required.',
            'area.required' => 'The area is required.',
            'payee_type.required' => 'The payee type is required.',
            'rfp_currency_id.required' => 'The currency is required.',
            'rfp_usage_id.required' => 'The usage is required.',
            'details.required' => 'At least one detail item is required.',
            'details.min' => 'At least one detail item is required.',
            'details.*.description.required' => 'Description is required for each detail.',
            'details.*.total_amount.required' => 'Amount is required for each detail.',
            'details.*.total_amount.min' => 'Amount must be greater than zero.',
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
                        return !empty($item['account_code']) ||
                            !empty($item['account_name']) ||
                            !empty($item['description']) ||
                            !empty($item['total_amount']);
                    })
                    ->values()
                    ->toArray()
            ]);
        }
    }
}
