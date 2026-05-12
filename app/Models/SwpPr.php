<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SwpPr extends Model
{
    protected $connection = 'mysql';
    protected $table = 'pr';
    protected $primaryKey = 'custom_id';
    public $keyType = 'string';
    public $incrementing = false;
}
