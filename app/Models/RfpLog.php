<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class RfpLog extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'rfp_id',
        'code',
        'user_id',
        'from',
        'into',
        'details',
        'remarks'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($log) {
            if (!$log->code) {
                $log->code = 'LOG-' . strtoupper(Str::random(12));
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
