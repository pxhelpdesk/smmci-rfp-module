<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfpDetail extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'rfp_request_id',
        'account_code',
        'account_name',
        'description',
        'total_amount',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function rfpRequest()
    {
        return $this->belongsTo(RfpRequest::class);
    }
}
