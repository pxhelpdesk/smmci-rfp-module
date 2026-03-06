<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RfpCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['code' => 'UTIL', 'name' => 'Utilities', 'description' => 'Utility-related expenses'],
            ['code' => 'SERV', 'name' => 'Services/Professional Fees', 'description' => 'Professional services and fees'],
            ['code' => 'GOVT', 'name' => 'Government Agencies and Payroll', 'description' => 'Government-related payments and payroll'],
            ['code' => 'ADVN', 'name' => 'Advances/Down payments', 'description' => 'Advance payments and down payments'],
            ['code' => 'OTHR', 'name' => 'Others', 'description' => 'Other miscellaneous expenses'],
        ];

        foreach ($categories as $category) {
            DB::connection('mysql_rfp')->table('rfp_categories')->insert([
                'code' => $category['code'],
                'name' => $category['name'],
                'description' => $category['description'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
