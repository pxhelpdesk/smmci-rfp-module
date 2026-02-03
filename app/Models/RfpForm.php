<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfpForm extends Model
{
    use SoftDeletes;

    protected $connection = 'mysql_rfp';

    protected $fillable = ['code', 'description'];

    public function rfps()
    {
        return $this->hasMany(Rfp::class);
    }
}
