<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SwpRcw extends Model
{
    protected $connection = 'mysql';
    protected $table = 'rcw';
    protected $primaryKey = 'custom_id';
    public $keyType = 'string';
    public $incrementing = false;
}
