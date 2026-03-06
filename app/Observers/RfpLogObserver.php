<?php

namespace App\Observers;

use App\Models\RfpLog;
use Illuminate\Support\Str;

class RfpLogObserver
{
    /**
     * Handle the RfpLog "creating" event.
     */
    public function creating(RfpLog $rfpLog): void
    {
        if (empty($rfpLog->code)) {
            $rfpLog->code = $this->generateLogCode();
        }
    }

    /**
     * Generate unique 6-character alphanumeric code.
     */
    private function generateLogCode(): string
    {
        do {
            // Generate random 6-character alphanumeric code (uppercase)
            $code = strtoupper(Str::random(6));
        } while (RfpLog::where('code', $code)->exists());

        return $code;
    }
}
