<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

 Schedule::command('sap:sync-suppliers')->twiceDaily(6, 18); 