<?php

namespace App\Http\Controllers;

use App\Models\Rfp;
use App\Models\RfpCurrency;
use App\Models\RfpCategory;
use App\Models\RfpUsage;
use App\Http\Requests\StoreRfpRequest;
use App\Http\Requests\UpdateRfpRequest;
use Inertia\Inertia;

class RfpController extends Controller
{
    public function index()
    {
        $rfps = Rfp::with([
            'currency:id,code,name',
            'usage:id,code,description',
            'details'
        ])->latest()->paginate(15);

        return Inertia::render('rfp/index', [
            'rfps' => $rfps
        ]);
    }

    public function create()
    {
        return Inertia::render('rfp/create', [
            'currencies' => RfpCurrency::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function store(StoreRfpRequest $request)
    {
        $rfp = Rfp::create($request->validated());

        if ($request->has('details')) {
            $rfp->details()->createMany($request->details);
        }

        return redirect()->route('rfp.requests.index')
            ->with('success', "RFP {$rfp->rfp_number} created successfully.");
    }

    public function show(Rfp $request)
    {
        $request->load([
            'currency',
            'usage.category',
            'details',
            'signs.user.department',
            'logs.user.department'
        ]);

        return Inertia::render('rfp/show', [
            'rfp' => $request
        ]);
    }

    public function edit(Rfp $request)
    {
        $request->load('details');

        return Inertia::render('rfp/edit', [
            'rfp' => $request,
            'currencies' => RfpCurrency::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get(),
        ]);
    }

    public function update(UpdateRfpRequest $updateRequest, Rfp $request)
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
            ->with('success', "RFP {$request->rfp_number} updated successfully.");
    }

    public function destroy(Rfp $request)
    {
        $rfpNumber = $request->rfp_number;
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
}
