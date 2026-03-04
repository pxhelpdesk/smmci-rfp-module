<?php

namespace App\Http\Controllers;

use App\Models\RfpRecord;
use App\Models\RfpCurrency;
use App\Models\RfpCategory;
use App\Models\RfpUsage;
use App\Models\RfpLog;
use App\Http\Requests\StoreRfpRecordRequest;
use App\Http\Requests\UpdateRfpRecordRequest;
use Inertia\Inertia;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RfpRecordController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfp-record-view', only: ['index', 'show']),
            new Middleware('permission:rfp-record-create', only: ['create', 'store']),
            new Middleware('permission:rfp-record-edit', only: ['edit', 'update']),
            new Middleware('permission:rfp-record-delete', only: ['destroy']),
        ];
    }

    public function index()
    {
        $user = auth()->user();
        $userId = $user->id;
        $departmentId = $user->department_id;

        // Get all user IDs in the same department (cross-db safe)
        $sameDeptUserIds = \App\Models\User::where('department_id', $departmentId)
            ->pluck('id')
            ->toArray();

        // Get RFP IDs where user is a signatory
        $signedRfpIds = \App\Models\RfpSign::where('user_id', $userId)
            ->pluck('rfp_record_id')
            ->toArray();

        $rfp_records = RfpRecord::with([
            'currency',
            'usage.category',
            'details',
            'signs.user.department',
            'preparedBy.department',
            'supplier',
        ])
        ->where(function ($query) use ($userId, $sameDeptUserIds, $signedRfpIds) {
            $query->where('prepared_by', $userId)
                ->orWhereIn('prepared_by', $sameDeptUserIds)
                ->orWhereIn('id', $signedRfpIds);
        })
        ->latest()
        ->paginate(15);

        return Inertia::render('rfp/records/index', [
            'rfp_records' => $rfp_records
        ]);
    }

    public function create()
    {
        $phpCurrency = RfpCurrency::where('code', 'PHP')
            ->where('is_active', true)
            ->first();

        return Inertia::render('rfp/records/create', [
            'currencies' => RfpCurrency::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'defaultCurrencyId' => $phpCurrency?->id ?? null,
        ]);
    }

    public function store(StoreRfpRecordRequest $request)
    {
        $validated = $request->validated();

        // Calculate details subtotal
        $detailsSubtotal = collect($request->details)->sum('total_amount');
        $validated['subtotal_details_amount'] = $detailsSubtotal;

        $validated['prepared_by'] = auth()->id();
        $rfpRecord = RfpRecord::create($validated);

        if ($request->has('details')) {
            $rfpRecord->details()->createMany($request->details);
        }

        return redirect()->route('rfp.records.index')->with('success', "RFP {$rfpRecord->rfp_number} created successfully.");
    }

    public function show(RfpRecord $record)
    {
        $user = auth()->user();
        $userId = $user->id;
        $departmentId = $user->department_id;

        $sameDeptUserIds = \App\Models\User::where('department_id', $departmentId)
            ->pluck('id')
            ->toArray();

        $isSignatory = \App\Models\RfpSign::where('rfp_record_id', $record->id)
            ->where('user_id', $userId)
            ->exists();

        $isPreparedByDept = in_array($record->prepared_by, $sameDeptUserIds);
        $isOwner = $record->prepared_by === $userId;

        abort_unless($isOwner || $isPreparedByDept || $isSignatory, 403);

        $record->load([
            'currency',
            'usage.category',
            'details',
            'signs.user.department',
            'preparedBy.department',
            'supplier',
        ]);

        $logs = RfpLog::where('rfp_record_id', $record->id)
            ->with('user.department')
            ->latest()
            ->paginate(10, ['*'], 'logs_page');

        return Inertia::render('rfp/records/show', [
            'rfp_record' => $record,
            'logs' => $logs,
        ]);
    }

    public function edit(RfpRecord $record)
    {
        $record->load(['details', 'usage.category']);

        return Inertia::render('rfp/records/edit', [
            'rfp_record' => $record,
            'currencies' => RfpCurrency::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function update(UpdateRfpRecordRequest $updateRequest, RfpRecord $record)
    {
        $validated = $updateRequest->validated();

        // Calculate details subtotal
        $detailsSubtotal = collect($updateRequest->details)->sum('total_amount');
        $validated['subtotal_details_amount'] = $detailsSubtotal;

        // Track changes for logging
        $changes = $this->detectChanges($record, $validated);

        // Extract details and log_remarks before updating
        $details = $validated['details'] ?? [];
        $logRemarks = $validated['log_remarks'] ?? null;
        unset($validated['details']);
        unset($validated['log_remarks']);

        // Update RFP
        $record->update($validated);

        // Update details
        if (!empty($details)) {
            $record->details()->delete();
            $record->details()->createMany($details);
        }

        // Create log entry if there are changes
        if (!empty($changes)) {
            RfpLog::create([
                'rfp_record_id' => $record->id,
                'user_id' => auth()->id(),
                'from' => $record->status,
                'into' => $record->status,
                'details' => json_encode($changes),
                'remarks' => $logRemarks,
            ]);
        }

        return redirect()->route('rfp.records.show', $record->id)->with('success', "RFP {$record->rfp_number} updated successfully.");
    }

    /**
     * Detect changes between original and new values
     */
    private function detectChanges(RfpRecord $original, array $newData): array
    {
        $changes = [];

        $fieldsToTrack = [
            'ap_no' => 'AP No.',
            'due_date' => 'Due Date',
            'rr_no' => 'RR No.',
            'po_no' => 'PO No.',
            'requisition_no' => 'Requisition No.',
            'contract_no' => 'Contract No.',
            'area' => 'Area',
            'payee_type' => 'Payee Type',
            'employee_code' => 'Employee Code',
            'employee_name' => 'Employee Name',
            'supplier_code' => 'Supplier Code',
            'supplier_name' => 'Supplier Name',
            'vendor_ref' => 'Vendor Reference',
            'rfp_currency_id' => 'Currency',
            'rfp_usage_id' => 'Usage',
            'subtotal_details_amount' => 'Details Subtotal',
            'less_down_payment_amount' => 'Down Payment',
            'wtax_amount' => 'Withholding Tax',
            'grand_total_amount' => 'Grand Total',
            'remarks' => 'Remarks',
        ];

        foreach ($fieldsToTrack as $field => $label) {
            $oldValue = $original->$field;
            $newValue = $newData[$field] ?? null;

            // Normalize values for comparison
            $oldNormalized = $this->normalizeValue($field, $oldValue);
            $newNormalized = $this->normalizeValue($field, $newValue);

            // Only log if actually different
            if ($oldNormalized !== $newNormalized) {
                $changes[] = [
                    'field' => $label,
                    'old' => $this->formatValue($field, $oldValue, $original),
                    'new' => $this->formatValue($field, $newValue, $original),
                ];
            }
        }

        return $changes;
    }

    /**
     * Normalize value for accurate comparison
     */
    private function normalizeValue(string $field, $value)
    {
        if ($value === null || $value === '') {
            return '';
        }

        // Normalize numeric fields
        if (in_array($field, ['subtotal_details_amount', 'less_down_payment_amount', 'wtax_amount', 'grand_total_amount'])) {
            return number_format((float) $value, 2, '.', '');
        }

        // Normalize dates
        if ($field === 'due_date' && $value) {
            return date('Y-m-d', strtotime($value));
        }

        return trim((string) $value);
    }

    /**
     * Format value for logging
     */
    private function formatValue(string $field, $value, RfpRecord $original)
    {
        if ($value === null || $value === '') {
            return 'N/A';
        }

        // Format currency fields
        if (in_array($field, ['subtotal_details_amount', 'less_down_payment_amount', 'wtax_amount', 'grand_total_amount'])) {
            return number_format((float) $value, 2);
        }

        // Format currency ID to show code
        if ($field === 'rfp_currency_id') {
            $currency = RfpCurrency::find($value);
            return $currency ? $currency->code : $value;
        }

        // Format usage ID to show code
        if ($field === 'rfp_usage_id') {
            $usage = RfpUsage::find($value);
            return $usage ? "{$usage->code} - {$usage->description}" : $value;
        }

        // Format date
        if ($field === 'due_date' && $value) {
            return date('m/d/Y', strtotime($value));
        }

        return $value;
    }

    public function destroy(RfpRecord $record)
    {
        $rfpNumber = $record->rfp_number;
        $record->delete();

        return redirect()->route('rfp.records.index')
            ->with('success', "RFP {$rfpNumber} deleted successfully.");
}

    public function getUsagesByCategory($categoryId)
    {
        $usages = RfpUsage::where('rfp_category_id', $categoryId)
            ->where('is_active', true)
            ->select('id', 'code', 'description')
            ->get();

        return response()->json($usages);
    }
}
