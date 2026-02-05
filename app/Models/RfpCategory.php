<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfpCategory extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function usages()
    {
        return $this->hasMany(RfpUsage::class);
    }

    public function rfp_requests()
    {
        return $this->hasMany(RfpRequest::class);
    }
}
