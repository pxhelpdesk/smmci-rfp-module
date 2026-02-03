<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class RfpSign extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'rfp_id',
        'code',
        'user_id',
        'user_type',
        'is_signed',
        'remarks'
    ];

    protected $casts = [
        'is_signed' => 'boolean'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sign) {
            if (!$sign->code) {
                $sign->code = 'SIGN-' . strtoupper(Str::random(12));
            }
        });
    }

    public function rfp()
    {
        return $this->belongsTo(Rfp::class);
    }

    public function user()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class)
            ->select('id', 'first_name', 'last_name', 'department_id');
    }
}
