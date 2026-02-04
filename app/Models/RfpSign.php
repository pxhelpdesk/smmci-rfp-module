<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class RfpSign extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = [
        'rfp_id',
        'code',
        'user_id',
        'is_signed',
        'details',
        'remarks',
    ];

    protected $casts = [
        'is_signed' => 'boolean',
    ];

    public function rfp()
    {
        return $this->belongsTo(Rfp::class);
    }

    public function user()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class, 'user_id');
    }
}
