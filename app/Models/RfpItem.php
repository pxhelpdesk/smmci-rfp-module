<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfpItem extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = ['rfp_id', 'account_code', 'account_name', 'payment_type', 'billed_amount'];

    protected $casts = [
        'billed_amount' => 'decimal:2'
    ];

    public function rfp()
    {
        return $this->belongsTo(Rfp::class);
    }
}
