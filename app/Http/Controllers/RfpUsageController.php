<?php

namespace App\Http\Controllers;

use App\Models\RfpUsage;
use App\Models\RfpCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RfpUsageController extends Controller
{
    public function index(Request $request)
    {
        $query = RfpUsage::with('category:id,code,name');

        if ($request->has('category_id')) {
            $query->where('rfp_category_id', $request->category_id);
        }

        $usages = $query->latest()->paginate(15);

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
