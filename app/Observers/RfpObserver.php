<?php

namespace App\Observers;

use App\Models\Rfp;
use App\Models\RfpLog;
use App\Models\RfpSign;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class RfpObserver
{
    public function creating(Rfp $rfp): void
    {
        if (!$rfp->rfp_number) {
            $rfp->rfp_number = $this->generateRfpNumber();
        }

        if (!$rfp->status) {
            $rfp->status = 'Draft';
        }

        $this->calculateTotals($rfp);
    }

    public function created(Rfp $rfp): void
    {
        $this->createInitialSigns($rfp);
        $this->logChange($rfp, null, 'Draft', 'RFP created');
    }

    public function updating(Rfp $rfp): void
    {
        $this->calculateTotals($rfp);
    }

    public function updated(Rfp $rfp): void
    {
        $changes = $rfp->getChanges();
        $original = $rfp->getOriginal();

        // Check if any approver fields changed
        $approverFields = ['requested_by', 'recommended_by', 'approved_by', 'concurred_by'];
        $changedApprovers = array_intersect($approverFields, array_keys($changes));

        if (!empty($changedApprovers)) {
            $this->smartUpdateSigns($rfp, $original, $changedApprovers);
        }

        if (isset($changes['status'])) {
            $this->logChange(
                $rfp,
                $original['status'] ?? null,
                $changes['status'],
                "Status changed from {$original['status']} to {$changes['status']}"
            );
        }

        $significantFields = [
            'total_before_vat', 'is_vatable', 'vat_type', 'down_payment',
            'withholding_tax', 'currency', 'due_date', 'rfp_form_id',
            'shared_description_id', 'payee_card_code', 'requested_by',
            'recommended_by', 'approved_by', 'concurred_by'
        ];

        $changedFields = array_filter(
            $changes,
            fn($key) => in_array($key, $significantFields),
            ARRAY_FILTER_USE_KEY
        );

        if (!empty($changedFields)) {
            $details = 'Updated fields: ' . implode(', ', array_keys($changedFields));
            $this->logChange($rfp, $rfp->status, $rfp->status, $details);
        }
    }

    public function deleted(Rfp $rfp): void
    {
        $this->logChange($rfp, $rfp->status, 'Deleted', 'RFP deleted');
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
        // TODO: Uncomment when ready for auto-calculation from items
        // if ($rfp->relationLoaded('items')) {
        //     $rfp->total_before_vat = $rfp->items->sum('billed_amount');
        // }

        if ($rfp->is_vatable && $rfp->total_before_vat) {
            if ($rfp->vat_type === 'Inclusive') {
                $rfp->vat_amount = $rfp->total_before_vat * 0.12 / 1.12;
            } else {
                $rfp->vat_amount = $rfp->total_before_vat * 0.12;
            }
        } else {
            $rfp->vat_amount = 0;
        }

        $rfp->grand_total = ($rfp->total_before_vat ?? 0)
            + ($rfp->vat_type === 'Exclusive' ? $rfp->vat_amount : 0)
            + ($rfp->withholding_tax ?? 0)
            - ($rfp->down_payment ?? 0);
    }

    private function createInitialSigns(Rfp $rfp): void
    {
        $signMappings = [
            'requested_by' => 'Requested By',
            'recommended_by' => 'Recommended By',
            'approved_by' => 'Approved By',
            'concurred_by' => 'Concurred By',
        ];

        foreach ($signMappings as $field => $userType) {
            if ($rfp->$field) {
                RfpSign::create([
                    'rfp_id' => $rfp->id,
                    'user_id' => $rfp->$field,
                    'user_type' => $userType,
                    'is_signed' => true,
                ]);
            }
        }
    }

    private function smartUpdateSigns(Rfp $rfp, array $original, array $changedFields): void
    {
        $signMappings = [
            'requested_by' => 'Requested By',
            'recommended_by' => 'Recommended By',
            'approved_by' => 'Approved By',
            'concurred_by' => 'Concurred By',
        ];

        foreach ($changedFields as $field) {
            $userType = $signMappings[$field];
            $oldUserId = $original[$field] ?? null;
            $newUserId = $rfp->$field;

            // If approver was removed, delete the sign
            if ($oldUserId && !$newUserId) {
                RfpSign::where('rfp_id', $rfp->id)
                    ->where('user_type', $userType)
                    ->delete();
            }
            // If approver changed, update or create
            elseif ($newUserId) {
                RfpSign::updateOrCreate(
                    [
                        'rfp_id' => $rfp->id,
                        'user_type' => $userType,
                    ],
                    [
                        'user_id' => $newUserId,
                        'is_signed' => true,
                    ]
                );
            }
        }
    }

    private function logChange(Rfp $rfp, ?string $from, ?string $into, string $details): void
    {
        RfpLog::create([
            'rfp_id' => $rfp->id,
            'user_id' => Auth::id(),
            'from' => $from,
            'into' => $into,
            'details' => $details,
        ]);
    }
}
