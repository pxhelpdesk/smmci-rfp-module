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

class RfpRequestController extends Controller
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
        $rfpRequest = RfpRequest::create($request->validated());

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
            'logs.user.department',
            'generatedBy'
        ]);

        return Inertia::render('rfp/requests/show', [
            'rfp_request' => $request
        ]);
    }

    public function edit(RfpRequest $request)
    {
        $request->load('details');

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

        // Extract details before updating
        $details = $validated['details'] ?? [];
        unset($validated['details']);

        // Update RFP
        $request->update($validated);

        // Update details
        if (!empty($details)) {
            $request->details()->delete();
            $request->details()->createMany($details);
        }

        return redirect()->route('rfp.requests.show', $request->id)
            ->with('success', "RFP {$request->rfp_request_number} updated successfully.");
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
