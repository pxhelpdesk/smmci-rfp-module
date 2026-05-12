<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks to allow truncation
        DB::connection('mysql_rfp')->statement('SET FOREIGN_KEY_CHECKS=0');

        // Truncate all RFP tables in reverse dependency order
        DB::connection('mysql_rfp')->table('rfp_logs')->truncate();
        DB::connection('mysql_rfp')->table('rfp_signs')->truncate();
        DB::connection('mysql_rfp')->table('rfp_details')->truncate();
        DB::connection('mysql_rfp')->table('rfp_records')->truncate();
        DB::connection('mysql_rfp')->table('rfp_usages')->truncate();
        DB::connection('mysql_rfp')->table('rfp_categories')->truncate();
        DB::connection('mysql_rfp')->table('rfp_currencies')->truncate();
        DB::connection('mysql_rfp')->table('sap_suppliers')->truncate();

        // Re-enable foreign key checks
        DB::connection('mysql_rfp')->statement('SET FOREIGN_KEY_CHECKS=1');

        // Run seeders
        $this->call([
            RfpCategorySeeder::class,
            RfpUsageSeeder::class,
            RfpCurrencySeeder::class,
        ]);

        // Sync SAP suppliers automatically
        $this->command->info('Syncing SAP suppliers...');
        $exitCode = Artisan::call('sap:sync-suppliers');

        if ($exitCode === 0) {
            $this->command->info('SAP suppliers synced successfully.');
        } else {
            $this->command->warn('SAP suppliers sync failed. Run manually: php artisan sap:sync-suppliers');
        }
    }
}
