<?php

namespace App\Observers;

use App\Models\RfpRequest;

class RfpObserver
{
    /**
     * Handle the RfpRequest "creating" event.
     */
    public function creating(RfpRequest $rfpRequest): void
    {
        if (empty($rfpRequest->rfp_request_number)) {
            $rfpRequest->rfp_request_number = $this->generateRfpNumber();
        }
    }

    /**
     * Generate unique RFP number.
     */
    private function generateRfpNumber(): string
    {
        $year = date('Y');
        $month = date('m');

        // Format: RFP-YYYY-MM-XXXX (e.g., RFP-2026-02-0001)
        $prefix = "RFP-{$year}-{$month}";

        // Get the last RFP number for this month (including soft deleted)
        $lastRfp = RfpRequest::withTrashed()
            ->where('rfp_request_number', 'LIKE', "{$prefix}-%")
            ->orderBy('rfp_request_number', 'desc')
            ->first();

        if ($lastRfp) {
            // Extract the sequence number and increment
            $lastNumber = intval(substr($lastRfp->rfp_request_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            // First RFP of the month
            $newNumber = '0001';
        }

        return "{$prefix}-{$newNumber}";
    }
}
