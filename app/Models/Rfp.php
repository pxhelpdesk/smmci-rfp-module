<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rfp extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'ap_no',
        'due_date',
        'rr_no',
        'po_no',
        'rfp_number',
        'area',
        'payee_type',
        'employee_code',
        'employee_name',
        'supplier_code',
        'supplier_name',
        'vendor_ref',
        'rfp_currency_id',
        'rfp_usage_id',
        'total_before_vat_amount',
        'less_down_payment_amount',
        'is_vatable',
        'vat_type',
        'vat_amount',
        'wtax_amount',
        'grand_total_amount',
        'remarks',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'is_vatable' => 'boolean',
        'total_before_vat_amount' => 'decimal:2',
        'less_down_payment_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'wtax_amount' => 'decimal:2',
        'grand_total_amount' => 'decimal:2',
    ];

    // Relationships
    public function currency()
    {
        return $this->belongsTo(RfpCurrency::class, 'rfp_currency_id');
    }

    public function usage()
    {
        return $this->belongsTo(RfpUsage::class, 'rfp_usage_id');
    }

    public function category()
    {
        return $this->hasOneThrough(
            RfpCategory::class,
            RfpUsage::class,
            'id',
            'id',
            'rfp_usage_id',
            'rfp_category_id'
        );
    }

    public function details()
    {
        return $this->hasMany(RfpDetail::class);
    }

    public function signs()
    {
        return $this->hasMany(RfpSign::class);
    }

    public function logs()
    {
        return $this->hasMany(RfpLog::class)->latest();
    }
}
