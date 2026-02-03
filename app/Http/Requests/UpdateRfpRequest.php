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
            'area' => 'nullable|in:Head Office,Mine Site',
            'rfp_form_id' => 'nullable|exists:mysql_rfp.rfp_forms,id',
            'payee_type' => 'nullable|in:Employee,Supplier',
            'payee_card_code' => 'nullable|string',
            'payee_card_name' => 'nullable|string',
            'payee_invoice_number' => 'nullable|string',
            'requested_by' => 'nullable|exists:users,id',
            'recommended_by' => 'nullable|exists:users,id',
            'approved_by' => 'nullable|exists:users,id',
            'concurred_by' => 'nullable|exists:users,id',
            'total_before_vat' => 'nullable|numeric',
            'is_vatable' => 'nullable|boolean',
            'vat_type' => 'nullable|in:Inclusive,Exclusive',
            'down_payment' => 'nullable|numeric',
            'withholding_tax' => 'nullable|numeric',
            'currency' => 'nullable|in:Peso,US Dollar',
            'remarks' => 'nullable|string',
            'due_date' => 'nullable|date|after:today',
            'shared_description_id' => 'nullable|exists:mysql_rfp.shared_descriptions,id',
            'purpose' => 'nullable|string',
            'status' => 'nullable|in:Draft,Cancelled,Final,Final with CV,Paid',
            'voucher_number' => 'nullable|string',
            'check_number' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.id' => 'sometimes|exists:mysql_rfp.rfp_items,id',
            'items.*.account_code' => 'nullable|string',
            'items.*.account_name' => 'nullable|string',
            'items.*.payment_type' => 'nullable|string',
            'items.*.billed_amount' => 'nullable|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'due_date.after' => 'The due date must be a future date.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        session()->flash('error', 'Please check the form for errors.');
        parent::failedValidation($validator);
    }

    protected function prepareForValidation()
    {
        // Remove items that don't have essential data
        if ($this->has('items')) {
            $this->merge([
                'items' => collect($this->items)
                    ->filter(fn($item) => !empty($item))
                    ->values()
                    ->toArray()
            ]);
        }
    }
}
