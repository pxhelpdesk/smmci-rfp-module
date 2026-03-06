<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\SapSupplier;
use Carbon\Carbon;

class SyncSapSuppliers extends Command
{
    protected $signature = 'sap:sync-suppliers';
    protected $description = 'Sync suppliers from SAP to local database';

    public function handle()
    {
        $this->info('Starting SAP suppliers sync...');

        try {
            $suppliers = DB::connection('sqlsrv')
                ->table('OCRD')
                ->where('CardType', 'S')
                ->where('FrozenFor', 'N')
                ->select('CardCode', 'CardName', 'Address', 'U_TIN1')
                ->get();

            $synced = 0;
            $now = Carbon::now();

            foreach ($suppliers as $supplier) {
                SapSupplier::updateOrCreate(
                    ['card_code' => $supplier->CardCode],
                    [
                        'card_name' => $supplier->CardName,
                        'address' => $supplier->Address,
                        'tin' => $supplier->U_TIN1,
                        'last_synced_at' => $now,
                    ]
                );
                $synced++;
            }

            // Mark suppliers not in SAP anymore as outdated
            SapSupplier::where('last_synced_at', '<', $now)->delete();

            $this->info("Successfully synced {$synced} suppliers.");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Sync failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
