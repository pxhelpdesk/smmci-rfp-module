<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Notifiable, HasRoles;

    protected $connection = 'mysql';

    protected $table = 'users';

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password_changed_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
    */
    protected $appends = ['name'];

    /**
     * Get the user's full name including suffix
    */
    public function getNameAttribute(): string
    {
        $nameParts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->suffix,
            $this->acronym,
        ]);

        return implode(' ', $nameParts);
    }
}
