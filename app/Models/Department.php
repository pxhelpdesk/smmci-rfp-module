<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $connection = 'mysql';

    protected $table = 'departments';

    // id, department, can_visit, created_at, updated_at, deleted_at

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
