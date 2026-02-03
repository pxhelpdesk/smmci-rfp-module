<?php

namespace App\Observers;

use App\Models\Rfp;
use Carbon\Carbon;

class RfpObserver
{
    public function creating(Rfp $rfp): void
    {
        if (!$rfp->rfp_number) {
            $rfp->rfp_number = $this->generateRfpNumber();
        }

        $this->calculateTotals($rfp);
    }

    public function updating(Rfp $rfp): void
    {
        $this->calculateTotals($rfp);
    }

    private function generateRfpNumber(): string
    {
        $yearMonth = Carbon::now()->format('Ym');
        $latestRfp = Rfp::where('rfp_number', 'like', $yearMonth . '%')
            ->orderBy('rfp_number', 'desc')
            ->first();

        $nextNumber = $latestRfp
            ? (int)substr($latestRfp->rfp_number, -4) + 1
            : 1;

        return $yearMonth . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    private function calculateTotals(Rfp $rfp): void
    {
        // Subtotal from items
        if ($rfp->relationLoaded('items')) {
            $rfp->subtotal = $rfp->items->sum('billed_amount');
        }

        // VAT calculation
        if ($rfp->is_vatable && $rfp->gross_amount) {
            if ($rfp->vat_type === 'Inclusive') {
                $rfp->vat_amount = $rfp->gross_amount * 0.12 / 1.12;
            } else {
                $rfp->vat_amount = $rfp->gross_amount * 0.12;
            }
        } else {
            $rfp->vat_amount = 0;
        }

        // Grand total
        $rfp->grand_total = ($rfp->gross_amount ?? 0)
            + ($rfp->vat_type === 'Exclusive' ? $rfp->vat_amount : 0)
            + ($rfp->withholding_tax ?? 0)
            - ($rfp->down_payment ?? 0);
    }
}
