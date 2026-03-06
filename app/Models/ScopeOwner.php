<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScopeOwner extends Model
{
    protected $connection = 'mysql';

    protected $table = 'scope_owners';

    // id, requestor_user_id, scope_owner_user_id, created_at, updated_at, deleted_at

    public function requestorUser()
    {
        return $this->belongsTo(User::class, 'requestor_user_id');
    }

    public function scopeOwnerUser()
    {
        return $this->belongsTo(User::class, 'scope_owner_user_id');
    }
}
