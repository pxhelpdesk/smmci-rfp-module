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
            'requestedBy:id,first_name,last_name,department_id',
            'requestedBy.department:id,department',
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

        return redirect()->route('requests.index');
    }

    public function show(Rfp $request)
    {
        $request->load([
            'rfpForm',
            'sharedDescription',
            'items',
            'requestedBy.department:id,department',
            'recommendedBy.department:id,department',
            'approvedBy.department:id,department',
            'concurredBy.department:id,department'
        ]);

        return Inertia::render('rfp/show', [
            'rfp' => $request
        ]);
    }

    public function edit(Rfp $request)
    {
        $request->load([
            'items',
            'requestedBy.department:id,department',
            'recommendedBy.department:id,department',
            'approvedBy.department:id,department',
            'concurredBy.department:id,department'
        ]);

        return Inertia::render('rfp/edit', [
            'rfp' => $request,
            'rfpForms' => RfpForm::select('id', 'code', 'description')->get(),
            'sharedDescriptions' => SharedDescription::select('id', 'code', 'description')->get(),
            'users' => User::select('id', 'first_name', 'last_name', 'department_id')
                ->with('department:id,department')
                ->get()
        ]);
    }

    public function update(UpdateRfpRequest $updateRequest, Rfp $request)
    {
        $request->update($updateRequest->validated());

        if ($updateRequest->has('items')) {
            $request->items()->delete();
            $request->items()->createMany($updateRequest->items);
            $request->load('items');
            $request->save();
        }

        return redirect()->route('requests.index');
    }

    public function destroy(Rfp $request)
    {
        $request->delete();
        return redirect()->route('requests.index');
    }
}
