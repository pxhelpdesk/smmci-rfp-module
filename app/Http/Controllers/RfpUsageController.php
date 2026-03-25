<?php

namespace App\Http\Controllers;

use App\Models\RfpUsage;
use App\Models\RfpCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RfpUsageController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfp-usage-view', only: ['index', 'show']),
            new Middleware('permission:rfp-usage-create', only: ['create', 'store']),
            new Middleware('permission:rfp-usage-edit', only: ['edit', 'update']),
            new Middleware('permission:rfp-usage-delete', only: ['destroy']),
        ];
    }

    public function index()
    {
        $usages = RfpUsage::with('category:id,code,name')->latest()->get();

        return Inertia::render('rfp/usages/index', [
            'usages' => $usages,
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('rfp/usages/create', [
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rfp_category_id' => 'required|exists:mysql_rfp.rfp_categories,id',
            'code' => 'required|string|unique:mysql_rfp.rfp_usages,code',
            'description' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $usage = RfpUsage::create($validated);

        return redirect()->route('rfp.usages.index')
            ->with('success', "Usage {$usage->description} created successfully.");
    }

    public function show(RfpUsage $usage)
    {
        $usage->load('category');

        return Inertia::render('rfp/usages/show', [
            'usage' => $usage
        ]);
    }

    public function edit(RfpUsage $usage)
    {
        return Inertia::render('rfp/usages/edit', [
            'usage' => $usage,
            'categories' => RfpCategory::select('id', 'code', 'name')
                ->where('is_active', true)
                ->get()
        ]);
    }

    public function update(Request $request, RfpUsage $usage)
    {
        $validated = $request->validate([
            'rfp_category_id' => 'required|exists:mysql_rfp.rfp_categories,id',
            'code' => 'required|string|unique:mysql_rfp.rfp_usages,code,' . $usage->id,
            'description' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $usage->update($validated);

        return redirect()->route('rfp.usages.index')
            ->with('success', "Usage {$usage->description} updated successfully.");
    }

    public function destroy(RfpUsage $usage)
    {
        $usageDescription = $usage->description;
        $usage->delete();

        return redirect()->route('rfp.usages.index')
            ->with('success', "Usage {$usageDescription} deleted successfully.");
    }
}
