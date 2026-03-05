<?php

namespace App\Observers;

use App\Models\RfpRecord;

class RfpObserver
{
    public function creating(RfpRecord $rfpRecord): void
    {
        if (empty($rfpRecord->rfp_number)) {
            $rfpRecord->rfp_number = $this->generateRfpNumber($rfpRecord->area);
        }
    }

    private function generateRfpNumber(string $area): string
    {
        $year = date('Y');
        $month = date('m');

        $prefix = match($area) {
            'head_office' => "HO-{$year}-{$month}",
            'mine_site' => "MS-{$year}-{$month}",
            default => "RFP-{$year}-{$month}",
        };

        $lastRfp = RfpRecord::withTrashed()
            ->where('rfp_number', 'LIKE', "{$prefix}-%")
            ->orderBy('rfp_number', 'desc')
            ->first();

        if ($lastRfp) {
            $lastNumber = intval(substr($lastRfp->rfp_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "{$prefix}-{$newNumber}";
    }
}
