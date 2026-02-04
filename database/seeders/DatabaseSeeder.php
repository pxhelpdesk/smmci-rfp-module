<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RfpCurrencySeeder::class,
            RfpCategorySeeder::class,
            RfpUsageSeeder::class,
        ]);
    }
}
