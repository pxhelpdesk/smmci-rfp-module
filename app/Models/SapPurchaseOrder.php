<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SapPurchaseOrder extends Model
{
    protected $connection = 'mysql';
    protected $table = 'sap_purchase_orders';
    protected $primaryKey = 'id';
}
