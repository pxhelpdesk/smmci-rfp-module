<?php

namespace App\Http\Controllers;

use App\Models\Rfp;
use App\Models\RfpForm;
use App\Models\SharedDescription;
use App\Models\User;
use App\Http\Requests\StoreRfpRequest;
use App\Http\Requests\UpdateRfpRequest;
use Inertia\Inertia;

class RfpController extends Controller
{
    public function index()
    {
        $rfps = Rfp::with([
            'rfpForm:id,code,description',
            'sharedDescription:id,code,description',
            'items'
        ])->latest()->paginate(15);

        return Inertia::render('rfp/index', [
            'rfps' => $rfps
        ]);
    }

    public function create()
    {
        return Inertia::render('rfp/create', [
            'rfpForms' => RfpForm::select('id', 'code', 'description')->get(),
            'sharedDescriptions' => SharedDescription::select('id', 'code', 'description')->get(),
            'users' => User::select('id', 'first_name', 'last_name', 'department_id')
                ->with('department:id,department')
                ->get()
        ]);
    }

    public function store(StoreRfpRequest $request)
    {
        $rfp = Rfp::create($request->validated());

        if ($request->has('items')) {
            $rfp->items()->createMany($request->items);
            $rfp->load('items');
            $rfp->save();
        }

        return redirect()->route('requests.index')->with('success', "RFP {$rfp->rfp_number} created successfully.");
    }

    public function show(Rfp $request)
    {
        $request->load([
            'rfpForm',
            'sharedDescription',
            'items',
            'signs.user.department',
            'logs.user.department',
            'requestedBy.department',
            'recommendedBy.department',
            'approvedBy.department',
            'concurredBy.department'
        ]);

        return Inertia::render('rfp/show', [
            'rfp' => $request
        ]);
    }

    public function edit(Rfp $request)
    {
        $request->load([
            'items',
            'requestedBy.department',
            'recommendedBy.department',
            'approvedBy.department',
            'concurredBy.department'
        ]);

        // Convert to array and ensure approver fields are IDs only
        $rfpData = $request->toArray();
        $rfpData['requested_by'] = $request->requested_by;
        $rfpData['recommended_by'] = $request->recommended_by;
        $rfpData['approved_by'] = $request->approved_by;
        $rfpData['concurred_by'] = $request->concurred_by;

        return Inertia::render('rfp/edit', [
            'rfp' => $rfpData,
            'rfpForms' => RfpForm::select('id', 'code', 'description')->get(),
            'sharedDescriptions' => SharedDescription::select('id', 'code', 'description')->get(),
            'users' => User::select('id', 'first_name', 'last_name', 'department_id')
                ->with('department:id,department')
                ->get()
        ]);
    }

    public function update(UpdateRfpRequest $updateRequest, Rfp $request)
    {
        $validated = $updateRequest->validated();

        // Extract items before updating
        $items = $validated['items'] ?? [];
        unset($validated['items']);

        // Update RFP
        $request->update($validated);

        // Update items
        if (!empty($items)) {
            $request->items()->delete();
            $request->items()->createMany($items);
            $request->load('items');
            $request->save();
        }

        return redirect()->route('requests.show', $request->id)->with('success', "RFP {$request->rfp_number} updated successfully.");
    }

    public function destroy(Rfp $request)
    {
        $rfpNumber = $request->rfp_number;
        $request->delete();

        return redirect()->route('requests.index')->with('success', "RFP {$rfpNumber} deleted successfully.");
    }
}
