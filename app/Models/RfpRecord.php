<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfpRecord extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'prepared_by',
        'ap_no',
        'due_date',
        'rr_no',
        'po_no',
        'swp_pr_no',
        'swp_rcw_no',
        'rfp_number',
        'office',
        'payee_type',
        'employee_code',
        'employee_name',
        'supplier_code',
        'supplier_name',
        'vendor_ref',
        'rfp_currency_id',
        'subtotal_details_amount',
        'purpose',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'subtotal_details_amount' => 'decimal:2',
    ];

    // Relationships
    public function currency()
    {
        return $this->belongsTo(RfpCurrency::class, 'rfp_currency_id');
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

    public function preparedBy()
    {
        return $this->setConnection('mysql')->belongsTo(User::class, 'prepared_by');
    }

    public function supplier()
    {
        return $this->belongsTo(SapSupplier::class, 'supplier_code', 'card_code');
    }
}
