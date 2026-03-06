<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfpDetail extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'rfp_record_id',
        'rfp_usage_id',
        'total_amount',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function rfpRecord()
    {
        return $this->belongsTo(RfpRecord::class);
    }

    public function usage()
    {
        return $this->belongsTo(RfpUsage::class, 'rfp_usage_id');
    }
}
