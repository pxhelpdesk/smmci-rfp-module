<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rfp extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'rfp_number', 'area', 'rfp_form_id', 'payee_type', 'payee_card_code', 'payee_card_name',
        'payee_invoice_number', 'requested_by', 'recommended_by', 'approved_by',
        'concurred_by', 'subtotal', 'total_before_vat', 'is_vatable',
        'vat_type', 'down_payment', 'vat_amount', 'withholding_tax',
        'grand_total', 'currency', 'remarks', 'due_date', 'shared_description_id',
        'purpose', 'status', 'voucher_number', 'check_number'
    ];

    protected $casts = [
        'is_vatable' => 'boolean',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'total_before_vat' => 'decimal:2',
        'down_payment' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'withholding_tax' => 'decimal:2',
        'grand_total' => 'decimal:2'
    ];

    protected $with = ['rfpForm', 'sharedDescription', 'items'];

    public function rfpForm()
    {
        return $this->belongsTo(RfpForm::class);
    }

    public function sharedDescription()
    {
        return $this->belongsTo(SharedDescription::class);
    }

    public function items()
    {
        return $this->hasMany(RfpItem::class);
    }

    public function signs()
    {
        return $this->hasMany(RfpSign::class);
    }

    public function logs()
    {
        return $this->hasMany(RfpLog::class)->latest();
    }

    public function requestedBy()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class, 'requested_by')
            ->select('id', 'first_name', 'last_name', 'department_id');
    }

    public function recommendedBy()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class, 'recommended_by')
            ->select('id', 'first_name', 'last_name', 'department_id');
    }

    public function approvedBy()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class, 'approved_by')
            ->select('id', 'first_name', 'last_name', 'department_id');
    }

    public function concurredBy()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class, 'concurred_by')
            ->select('id', 'first_name', 'last_name', 'department_id');
    }
}
