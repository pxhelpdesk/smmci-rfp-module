<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RfpCurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            ['code' => 'PHP', 'name' => 'Philippine Peso', 'description' => null, 'is_active' => true],
            ['code' => 'AUD', 'name' => 'Australian Dollar', 'description' => null, 'is_active' => true],
            ['code' => 'EUR', 'name' => 'Euro', 'description' => null, 'is_active' => true],
            ['code' => 'USD', 'name' => 'US Dollar', 'description' => null, 'is_active' => true],
            ['code' => 'ZAR', 'name' => 'South African Rand', 'description' => null, 'is_active' => true],
        ];

        foreach ($currencies as $currency) {
            DB::connection('mysql_rfp')->table('rfp_currencies')->insert([
                'code' => $currency['code'],
                'name' => $currency['name'],
                'description' => $currency['description'],
                'is_active' => $currency['is_active'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
