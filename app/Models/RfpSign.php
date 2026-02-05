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
        'rfp_request_id',
        'code',
        'user_id',
        'is_signed',
        'details',
        'remarks',
    ];

    protected $casts = [
        'is_signed' => 'boolean',
    ];

    public function rfpRequest()
    {
        return $this->belongsTo(RfpRequest::class);
    }

    public function user()
    {
        return $this->setConnection('mysql')
            ->belongsTo(User::class, 'user_id');
    }
}
