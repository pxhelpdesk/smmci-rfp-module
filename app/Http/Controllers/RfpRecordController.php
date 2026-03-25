<?php

namespace App\Http\Controllers;

use App\Models\RfpRecord;
use App\Models\RfpCurrency;
use App\Models\RfpCategory;
use App\Models\RfpUsage;
use App\Models\RfpSign;
use App\Models\RfpLog;
use App\Models\DepartmentHead;
use App\Models\ScopeOwner;
use App\Models\User;
use App\Http\Requests\StoreRfpRecordRequest;
use App\Http\Requests\UpdateRfpRecordRequest;
use Inertia\Inertia;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\Request;

class RfpRecordController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfp-record-view', only: ['index', 'show']),
            new Middleware('permission:rfp-record-create', only: ['create', 'store']),
            new Middleware('permission:rfp-record-edit', only: ['edit', 'update']),
            new Middleware('permission:rfp-record-delete', only: ['destroy']),
            new Middleware('permission:rfp-record-cancel', only: ['cancel']),
            new Middleware('permission:rfp-record-paid', only: ['markAsPaid']),
            new Middleware('permission:rfp-record-revert', only: ['revert']),
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $userId = $user->id;
        $departmentId = $user->department_id;

        $query = RfpRecord::with([
            'currency',
            'details.usage.category',
            'signs.user.department',
            'preparedBy.department',
            'supplier',
        ]);

        if (!$user->hasPermissionTo('rfp-record-all')) {
            $sameDeptUserIds = User::where('department_id', $departmentId)
                ->pluck('id')
                ->toArray();

            $signedRfpIds = RfpSign::where('user_id', $userId)
                ->pluck('rfp_record_id')
                ->toArray();

            $query->where(function ($q) use ($userId, $sameDeptUserIds, $signedRfpIds) {
                $q->where('prepared_by', $userId)
                    ->orWhereIn('prepared_by', $sameDeptUserIds)
                    ->orWhereIn('id', $signedRfpIds);
            });
        }

        $rfp_records = $query->latest()->get();

        return Inertia::render('rfp/records/index', [
            'rfp_records' => $rfp_records,
        ]);
    }

    public function create()
    {
        $phpCurrency = RfpCurrency::where('code', 'PHP')->where('is_active', true)->first();

        $users = User::select('id', 'first_name', 'middle_name', 'last_name', 'suffix', 'acronym')
            ->with('department:id,department')
            ->where('is_locked', false)
            ->orderBy('first_name')
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'department' => $u->department?->department]);

        $scopeOwner = ScopeOwner::where('requestor_user_id', auth()->id())
            ->with('scopeOwnerUser.department')
            ->first();

        $departmentHead = DepartmentHead::where('department_id', auth()->user()->department_id)
            ->with('user.department')
            ->first();

        $residentManager = User::whereHas('roles', fn($q) => $q->where('name', 'Resident Manager'))
            ->with('department')
            ->first();

        if (!$residentManager) {
            $residentManager = User::whereHas('roles', fn($q) => $q->where('name', 'Project Lead'))
                ->with('department')
                ->first();
        }

        $cfo = User::whereHas('roles', fn($q) => $q->where('name', 'CFO'))
            ->with('department')
            ->first();

        $ceo = User::whereHas('roles', fn($q) => $q->where('name', 'CEO'))
            ->with('department')
            ->first();

        return Inertia::render('rfp/records/create', [
            'currencies' => RfpCurrency::select('id', 'code', 'name')->where('is_active', true)->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')->where('is_active', true)->get(),
            'defaultCurrencyId' => $phpCurrency?->id ?? null,
            'users' => $users,
            'scopeOwner' => $scopeOwner ? [
                'id' => $scopeOwner->scopeOwnerUser->id,
                'name' => $scopeOwner->scopeOwnerUser->name,
                'department' => $scopeOwner->scopeOwnerUser->department?->department,
            ] : null,
            'departmentHead' => $departmentHead?->user ? [
                'id' => $departmentHead->user->id,
                'name' => $departmentHead->user->name,
                'department' => $departmentHead->user->department?->department,
            ] : null,
            'residentManager' => $residentManager ? [
                'id' => $residentManager->id,
                'name' => $residentManager->name,
                'department' => $residentManager->department?->department,
            ] : null,
            'cfo' => $cfo ? ['id' => $cfo->id, 'name' => $cfo->name, 'department' => $cfo->department?->department] : null,
            'ceo' => $ceo ? ['id' => $ceo->id, 'name' => $ceo->name, 'department' => $ceo->department?->department] : null,
        ]);
    }

    public function store(StoreRfpRecordRequest $request)
    {
        $validated = $request->validated();

        $detailsSubtotal = collect($request->details)->sum('total_amount');
        $validated['subtotal_details_amount'] = $detailsSubtotal;
        $validated['prepared_by'] = auth()->id();

        $detailsData = $validated['details'] ?? [];
        $signsData = $validated['signs'] ?? [];
        $logRemarks = $validated['log_remarks'] ?? null;

        unset($validated['details'], $validated['signs'], $validated['log_remarks']);

        $rfpRecord = RfpRecord::create($validated);

        if (!empty($detailsData)) {
            $rfpRecord->details()->createMany(
                collect($detailsData)->map(fn($d) => [
                    'rfp_usage_id' => $d['rfp_usage_id'],
                    'total_amount' => $d['total_amount'],
                ])->toArray()
            );
        }

        if (!empty($signsData)) {
            $rfpRecord->signs()->createMany(
                collect($signsData)->map(fn($s) => [
                    'user_id' => $s['user_id'],
                    'details' => $s['details'],
                    'is_signed' => null,
                ])->toArray()
            );
        }

        RfpLog::create([
            'rfp_record_id' => $rfpRecord->id,
            'user_id' => auth()->id(),
            'from' => null,
            'into' => 'draft',
            'details' => null,
            'remarks' => !empty($logRemarks) ? $logRemarks : 'Record created.',
        ]);

        return redirect()->route('rfp.records.index')->with('success', "RFP {$rfpRecord->rfp_number} created successfully.");
    }

    public function show(RfpRecord $record)
    {
        $user = auth()->user();
        $userId = $user->id;
        $departmentId = $user->department_id;

        $sameDeptUserIds = User::where('department_id', $departmentId)
            ->pluck('id')
            ->toArray();

        $isSignatory = RfpSign::where('rfp_record_id', $record->id)
            ->where('user_id', $userId)
            ->exists();

        $isPreparedByDept = in_array($record->prepared_by, $sameDeptUserIds);
        $isOwner = $record->prepared_by === $userId;

        abort_unless($isOwner || $isPreparedByDept || $isSignatory, 403);

        $record->load([
            'currency',
            'details.usage.category',
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
        abort_if($record->status === 'cancelled', 403, 'Cancelled RFP cannot be edited.');

        $record->load(['details.usage.category', 'signs.user.department']);

        $users = User::select('id', 'first_name', 'middle_name', 'last_name', 'suffix', 'acronym')
            ->with('department:id,department')
            ->where('is_locked', false)
            ->orderBy('first_name')
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'department' => $u->department?->department]);

        $scopeOwner = ScopeOwner::where('requestor_user_id', auth()->id())
            ->with('scopeOwnerUser.department')
            ->first();

        $departmentHead = DepartmentHead::where('department_id', auth()->user()->department_id)
            ->with('user.department')
            ->first();

        $residentManager = User::whereHas('roles', fn($q) => $q->where('name', 'Resident Manager'))
            ->with('department')
            ->first();

        if (!$residentManager) {
            $residentManager = User::whereHas('roles', fn($q) => $q->where('name', 'Project Lead'))
                ->with('department')
                ->first();
        }

        $cfo = User::whereHas('roles', fn($q) => $q->where('name', 'CFO'))
            ->with('department')
            ->first();

        $ceo = User::whereHas('roles', fn($q) => $q->where('name', 'CEO'))
            ->with('department')
            ->first();

        return Inertia::render('rfp/records/edit', [
            'rfp_record' => $record,
            'currencies' => RfpCurrency::select('id', 'code', 'name')->where('is_active', true)->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')->where('is_active', true)->get(),
            'users' => $users,
            'scopeOwner' => $scopeOwner ? [
                'id' => $scopeOwner->scopeOwnerUser->id,
                'name' => $scopeOwner->scopeOwnerUser->name,
                'department' => $scopeOwner->scopeOwnerUser->department?->department,
            ] : null,
            'departmentHead' => $departmentHead?->user ? [
                'id' => $departmentHead->user->id,
                'name' => $departmentHead->user->name,
                'department' => $departmentHead->user->department?->department,
            ] : null,
            'residentManager' => $residentManager ? [
                'id' => $residentManager->id,
                'name' => $residentManager->name,
                'department' => $residentManager->department?->department,
            ] : null,
            'cfo' => $cfo ? ['id' => $cfo->id, 'name' => $cfo->name, 'department' => $cfo->department?->department] : null,
            'ceo' => $ceo ? ['id' => $ceo->id, 'name' => $ceo->name, 'department' => $ceo->department?->department] : null,
        ]);
    }

    public function update(UpdateRfpRecordRequest $updateRequest, RfpRecord $record)
    {
        abort_if($record->status === 'cancelled', 403, 'Cancelled RFP cannot be edited.');

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
            $record->details()->createMany(
                collect($details)->map(fn($d) => [
                    'rfp_usage_id' => $d['rfp_usage_id'],
                    'total_amount' => $d['total_amount'],
                ])->toArray()
            );
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
            'office' => 'Office',
            'payee_type' => 'Payee Type',
            'employee_code' => 'Employee Code',
            'employee_name' => 'Employee Name',
            'supplier_code' => 'Supplier Code',
            'supplier_name' => 'Supplier Name',
            'vendor_ref' => 'Vendor Ref',
            'rfp_currency_id' => 'Currency',
            'subtotal_details_amount' => 'Details Subtotal',
            'wtax_amount' => 'Withholding Tax',
            'grand_total_amount' => 'Grand Total',
            'purpose' => 'Purpose',
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
            ->with('usage')
            ->whereNull('deleted_at')
            ->get();

        $newDetails = collect($newData['details'] ?? [])->filter(fn($d) => !empty($d['rfp_usage_id']) || !empty($d['total_amount']));

        $oldDetailsStr = $oldDetails
            ->map(fn($d) => $d->rfp_usage_id . '|' . number_format((float) $d->total_amount, 2, '.', ''))
            ->sort()
            ->values()
            ->join(';');

        $newDetailsStr = $newDetails
            ->map(fn($d) => ($d['rfp_usage_id'] ?? '') . '|' . number_format((float) ($d['total_amount'] ?? 0), 2, '.', ''))
            ->sort()
            ->values()
            ->join(';');

        if ($oldDetailsStr !== $newDetailsStr) {
            $changes[] = [
                'field' => 'Details',
                'old' => $oldDetails->count() > 0
                    ? $oldDetails->map(fn($d) => ($d->usage ? "{$d->usage->code} - {$d->usage->description}" : 'N/A') . ' — ' . number_format((float) $d->total_amount, 2))->join(', ')
                    : 'N/A',
                'new' => $newDetails->count() > 0
                    ? $newDetails->map(function($d) {
                        $usage = RfpUsage::find($d['rfp_usage_id'] ?? null);
                        return ($usage ? "{$usage->code} - {$usage->description}" : 'N/A') . ' — ' . number_format((float) ($d['total_amount'] ?? 0), 2);
                    })->join(', ')
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
            $newUsers = User::whereIn('id', $newUserIds)
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
        if (in_array($field, ['subtotal_details_amount'])) {
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
        if (in_array($field, ['subtotal_details_amount'])) {
            return number_format((float) $value, 2);
        }

        // Format currency ID to show code
        if ($field === 'rfp_currency_id') {
            $currency = RfpCurrency::find($value);
            return $currency ? $currency->code : $value;
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

        RfpLog::create([
            'rfp_record_id' => $record->id,
            'user_id' => auth()->id(),
            'from' => $record->status,
            'into' => 'deleted',
            'details' => null,
            'remarks' => !empty(request('remarks')) ? request('remarks') : 'Record deleted.',
        ]);

        $record->delete();

        return redirect()->route('rfp.records.index')->with('success', "RFP {$rfpNumber} deleted successfully.");
    }

    public function cancel(RfpRecord $record)
    {
        abort_if($record->status === 'cancelled', 422, 'RFP is already cancelled.');
        $previousStatus = $record->status;
        $record->update(['status' => 'cancelled']);
        RfpLog::create([
            'rfp_record_id' => $record->id,
            'user_id' => auth()->id(),
            'from' => $previousStatus,
            'into' => 'cancelled',
            'details' => null,
            'remarks' => !empty(request('remarks')) ? request('remarks') : 'Record cancelled.',
        ]);
        return redirect()->back()->with('success', "RFP {$record->rfp_number} has been cancelled.");
    }

    public function markAsPaid(RfpRecord $record)
    {
        abort_if($record->status === 'paid', 422, 'RFP is already marked as paid.');
        abort_if($record->status === 'cancelled', 422, 'Cancelled RFP cannot be marked as paid.');
        $previousStatus = $record->status;
        $record->update(['status' => 'paid']);
        RfpLog::create([
            'rfp_record_id' => $record->id,
            'user_id' => auth()->id(),
            'from' => $previousStatus,
            'into' => 'paid',
            'details' => null,
            'remarks' => !empty(request('remarks')) ? request('remarks') : 'Record marked as paid.',
        ]);
        return redirect()->back()->with('success', "RFP {$record->rfp_number} marked as paid.");
    }

    public function revert(RfpRecord $record)
    {
        abort_unless(in_array($record->status, ['paid', 'cancelled']), 422, 'Only paid or cancelled RFPs can be reverted to draft.');
        $previousStatus = $record->status;
        $record->update(['status' => 'draft']);
        RfpLog::create([
            'rfp_record_id' => $record->id,
            'user_id' => auth()->id(),
            'from' => $previousStatus,
            'into' => 'draft',
            'details' => null,
            'remarks' => !empty(request('remarks')) ? request('remarks') : 'Record reverted to draft.',
        ]);
        return redirect()->back()->with('success', "RFP {$record->rfp_number} reverted to draft.");
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
