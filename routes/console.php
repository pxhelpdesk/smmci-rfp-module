<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\SyncSapSuppliers;

// Artisan::command('inspire', function () {
//     $this->comment(Inspiring::quote());
// })->purpose('Display an inspiring quote');

// Schedule SAP suppliers sync to run every hour
Schedule::command(SyncSapSuppliers::class)
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();
