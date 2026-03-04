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
        $phpCurrency = RfpCurrency::where('code', 'PHP')->where('is_active', true)->first();

        $users = \App\Models\User::select('id', 'first_name', 'middle_name', 'last_name', 'suffix', 'acronym')
            ->with('department:id,department')
            ->orderBy('first_name')
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'department' => $u->department?->department]);

        return Inertia::render('rfp/records/create', [
            'currencies' => RfpCurrency::select('id', 'code', 'name')->where('is_active', true)->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')->where('is_active', true)->get(),
            'defaultCurrencyId' => $phpCurrency?->id ?? null,
            'users' => $users,
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

        if ($request->has('signs') && is_array($request->signs)) {
            $signs = collect($request->signs)->map(function ($sign) {
                return [
                    'user_id' => $sign['user_id'],
                    'details' => $sign['details'],
                    'is_signed' => null,
                ];
            })->toArray();
            $rfpRecord->signs()->createMany($signs);
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
        $record->load(['details', 'usage.category', 'signs.user.department']);

        $users = \App\Models\User::select('id', 'first_name', 'middle_name', 'last_name', 'suffix', 'acronym')
            ->with('department:id,department')
            ->orderBy('first_name')
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'department' => $u->department?->department]);

        return Inertia::render('rfp/records/edit', [
            'rfp_record' => $record,
            'currencies' => RfpCurrency::select('id', 'code', 'name')->where('is_active', true)->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')->where('is_active', true)->get(),
            'users' => $users,
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

        // Extract details, log_remarks, and signs before updating
        $details = $validated['details'] ?? [];
        $logRemarks = $validated['log_remarks'] ?? null;
        $signs = $validated['signs'] ?? null;
        unset($validated['details'], $validated['log_remarks'], $validated['signs']);

        // Update RFP
        $record->update($validated);

        // Update details
        if (!empty($details)) {
            $record->details()->delete();
            $record->details()->createMany($details);
        }

        // Update signs  ← remove the duplicate $signs = $validated['signs'] ?? null; line
        if ($signs !== null) {
            $record->signs()->delete();
            $signsToCreate = collect($signs)->map(fn($s) => [
                'user_id' => $s['user_id'],
                'details' => $s['details'],
                'is_signed' => null,
            ])->toArray();
            $record->signs()->createMany($signsToCreate);
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

            $oldNormalized = $this->normalizeValue($field, $oldValue);
            $newNormalized = $this->normalizeValue($field, $newValue);

            if ($oldNormalized !== $newNormalized) {
                $changes[] = [
                    'field' => $label,
                    'old' => $this->formatValue($field, $oldValue, $original),
                    'new' => $this->formatValue($field, $newValue, $original),
                ];
            }
        }

        // Detect details changes
        $oldDetails = $original->details()
            ->whereNull('deleted_at')
            ->get();

        $newDetails = collect($newData['details'] ?? [])
            ->filter(fn($d) => !empty($d['description']) || !empty($d['total_amount']));

        $oldDetailsStr = $oldDetails
            ->map(fn($d) => $d->description . '|' . number_format((float) $d->total_amount, 2, '.', ''))
            ->sort()
            ->values()
            ->join(';');

        $newDetailsStr = $newDetails
            ->map(fn($d) => ($d['description'] ?? '') . '|' . number_format((float) ($d['total_amount'] ?? 0), 2, '.', ''))
            ->sort()
            ->values()
            ->join(';');

        if ($oldDetailsStr !== $newDetailsStr) {
            $changes[] = [
                'field' => 'Details',
                'old' => $oldDetails->count() > 0
                    ? $oldDetails->map(fn($d) => ($d->description ?? 'N/A') . ' — ' . number_format((float) $d->total_amount, 2))->join(', ')
                    : 'N/A',
                'new' => $newDetails->count() > 0
                    ? $newDetails->map(fn($d) => ($d['description'] ?? 'N/A') . ' — ' . number_format((float) ($d['total_amount'] ?? 0), 2))->join(', ')
                    : 'N/A',
            ];
        }

        // Detect signatories changes (exclude prepared_by)
        $oldSigns = $original->signs()
            ->whereNull('deleted_at')
            ->where('details', '!=', 'prepared_by')
            ->get();

        $newSigns = collect($newData['signs'] ?? [])
            ->filter(fn($s) => ($s['details'] ?? '') !== 'prepared_by');

        $oldSignsStr = $oldSigns
            ->map(fn($s) => ($s->details ?? '') . ':' . ($s->user_id ?? ''))
            ->sort()
            ->values()
            ->join(';');

        $newSignsStr = $newSigns
            ->map(fn($s) => ($s['details'] ?? '') . ':' . ($s['user_id'] ?? ''))
            ->sort()
            ->values()
            ->join(';');

        if ($oldSignsStr !== $newSignsStr) {
            $roleLabels = [
                'recommending_approval_by' => 'Recommending Approval By',
                'approved_by' => 'Approved By',
                'concurred_by' => 'Concurred By',
            ];

            $formatSigns = fn($signs) => $signs->count() > 0
                ? $signs->map(fn($s) => ($roleLabels[$s['details'] ?? $s->details ?? ''] ?? 'N/A') . ': ' . ($s['name'] ?? $s->user?->name ?? 'N/A'))->join(', ')
                : 'N/A';

            // Load user names for old signs
            $oldSignsMapped = $oldSigns->map(fn($s) => [
                'details' => $s->details,
                'name' => $s->user?->name ?? 'N/A',
            ]);

            // Load user names for new signs
            $newUserIds = $newSigns->pluck('user_id')->filter()->unique()->toArray();
            $newUsers = \App\Models\User::whereIn('id', $newUserIds)
                ->get()
                ->keyBy('id');

            $newSignsMapped = $newSigns->map(fn($s) => [
                'details' => $s['details'] ?? '',
                'name' => isset($s['user_id']) && isset($newUsers[$s['user_id']])
                    ? $newUsers[$s['user_id']]->name
                    : 'N/A',
            ]);

            $changes[] = [
                'field' => 'Signatories',
                'old' => $formatSigns(collect($oldSignsMapped)),
                'new' => $formatSigns(collect($newSignsMapped)),
            ];
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
