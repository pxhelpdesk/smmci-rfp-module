<?php

namespace App\Http\Controllers;

use App\Models\RfpRequest;
use App\Models\RfpCurrency;
use App\Models\RfpCategory;
use App\Models\RfpUsage;
use App\Models\RfpLog;
use App\Http\Requests\StoreRfpRequest;
use App\Http\Requests\UpdateRfpRequest;
use Inertia\Inertia;

class RfpController extends Controller
{
    public function index()
    {
        $rfp_requests = RfpRequest::with([
            'currency:id,code,name',
            'usage:id,code,description',
            'details'
        ])->latest()->paginate(15);

        return Inertia::render('rfp/requests/index', [
            'rfp_requests' => $rfp_requests
        ]);
    }

    public function create()
    {
        $phpCurrency = RfpCurrency::where('code', 'PHP')
            ->where('is_active', true)
            ->first();

        return Inertia::render('rfp/requests/create', [
            'currencies' => RfpCurrency::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'defaultCurrencyId' => $phpCurrency?->id ?? null,
        ]);
    }

    public function store(StoreRfpRequest $request)
    {
        $validated = $request->validated();

        // Calculate details subtotal
        $detailsSubtotal = collect($request->details)->sum('total_amount');
        $validated['details_subtotal_amount'] = $detailsSubtotal;

        $rfpRequest = RfpRequest::create($validated);

        if ($request->has('details')) {
            $rfpRequest->details()->createMany($request->details);
        }

        return redirect()->route('rfp.requests.index')
            ->with('success', "RFP {$rfpRequest->rfp_request_number} created successfully.");
    }

    public function show(RfpRequest $request)
    {
        $request->load([
            'currency',
            'usage.category',
            'details',
            'signs.user.department',
            'generatedBy'
        ]);

        // Paginate logs separately
        $logs = RfpLog::where('rfp_request_id', $request->id)
            ->with('user.department')
            ->latest()
            ->paginate(10, ['*'], 'logs_page');

        return Inertia::render('rfp/requests/show', [
            'rfp_request' => $request,
            'logs' => $logs,
        ]);
    }

    public function edit(RfpRequest $request)
    {
        $request->load(['details', 'usage']);

        return Inertia::render('rfp/requests/edit', [
            'rfp_request' => $request,
            'currencies' => RfpCurrency::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function update(UpdateRfpRequest $updateRequest, RfpRequest $request)
    {
        $validated = $updateRequest->validated();

        // Calculate details subtotal
        $detailsSubtotal = collect($updateRequest->details)->sum('total_amount');
        $validated['details_subtotal_amount'] = $detailsSubtotal;

        // Track changes for logging
        $changes = $this->detectChanges($request, $validated);

        // Extract details and log_remarks before updating
        $details = $validated['details'] ?? [];
        $logRemarks = $validated['log_remarks'] ?? null;
        unset($validated['details']);
        unset($validated['log_remarks']);

        // Update RFP
        $request->update($validated);

        // Update details
        if (!empty($details)) {
            $request->details()->delete();
            $request->details()->createMany($details);
        }

        // Create log entry if there are changes
        if (!empty($changes)) {
            RfpLog::create([
                'rfp_request_id' => $request->id,
                'user_id' => auth()->id(),
                'from' => $request->status,
                'into' => $request->status,
                'details' => json_encode($changes),
                'remarks' => $logRemarks,
            ]);
        }

        return redirect()->route('rfp.requests.show', $request->id)
            ->with('success', "RFP {$request->rfp_request_number} updated successfully.");
    }

    /**
     * Detect changes between original and new values
     */
    private function detectChanges(RfpRequest $original, array $newData): array
    {
        $changes = [];

        $fieldsToTrack = [
            'ap_no' => 'AP Number',
            'due_date' => 'Due Date',
            'rr_no' => 'RR Number',
            'po_no' => 'PO Number',
            'area' => 'Area',
            'payee_type' => 'Payee Type',
            'employee_code' => 'Employee Code',
            'employee_name' => 'Employee Name',
            'supplier_code' => 'Supplier Code',
            'supplier_name' => 'Supplier Name',
            'vendor_ref' => 'Vendor Reference',
            'rfp_currency_id' => 'Currency',
            'rfp_usage_id' => 'Usage',
            'details_subtotal_amount' => 'Details Subtotal',
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
        if (in_array($field, ['details_subtotal_amount', 'less_down_payment_amount', 'wtax_amount', 'grand_total_amount'])) {
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
    private function formatValue(string $field, $value, RfpRequest $original)
    {
        if ($value === null || $value === '') {
            return 'N/A';
        }

        // Format currency fields
        if (in_array($field, ['details_subtotal_amount', 'less_down_payment_amount', 'wtax_amount', 'grand_total_amount'])) {
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

    public function destroy(RfpRequest $request)
    {
        $rfpNumber = $request->rfp_request_number;
        $request->delete();

        return redirect()->route('rfp.requests.index')
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

    public function trackPrint(RfpRequest $request)
    {
        $request->update([
            'pdf_generated_at' => now(),
            'pdf_generated_by' => auth()->id(),
            'pdf_generation_count' => $request->pdf_generation_count + 1,
        ]);

        // Log the PDF generation action with current status
        RfpLog::create([
            'rfp_request_id' => $request->id,
            'user_id' => auth()->id(),
            'from' => $request->status,
            'into' => $request->status,
            'details' => 'PDF document generated',
            'remarks' => 'PDF preview generated for printing/download',
        ]);

        return response()->json(['success' => true]);
    }
}
