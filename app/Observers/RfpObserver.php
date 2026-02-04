<?php

namespace App\Observers;

use App\Models\Rfp;

class RfpObserver
{
    /**
     * Handle the Rfp "creating" event.
     */
    public function creating(Rfp $rfp): void
    {
        if (empty($rfp->rfp_number)) {
            $rfp->rfp_number = $this->generateRfpNumber();
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

        // Get the last RFP number for this month
        $lastRfp = Rfp::where('rfp_number', 'LIKE', "{$prefix}-%")
            ->orderBy('rfp_number', 'desc')
            ->first();

        if ($lastRfp) {
            // Extract the sequence number and increment
            $lastNumber = intval(substr($lastRfp->rfp_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            // First RFP of the month
            $newNumber = '0001';
        }

        return "{$prefix}-{$newNumber}";
    }
}
