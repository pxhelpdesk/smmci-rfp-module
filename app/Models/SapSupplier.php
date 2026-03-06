<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SapSupplier extends Model
{
    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'card_code',
        'card_name',
        'address',
        'tin',
        'last_synced_at',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];
}
