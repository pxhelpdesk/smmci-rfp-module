<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentHead extends Model
{
    protected $connection = 'mysql';

    protected $table = 'department_heads';

    // id, department_id, user_id, created_at, updated_at, deleted_at

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
