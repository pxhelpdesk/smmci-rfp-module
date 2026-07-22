<?php

namespace App\Http\Controllers;

use App\Models\RfpUsage;
use App\Models\RfpCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RfpUsageController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:rfp-usage-view', ['only' => ['index', 'show']]);
        $this->middleware('permission:rfp-usage-create', ['only' => ['create', 'store', 'nextCode']]);
        $this->middleware('permission:rfp-usage-edit', ['only' => ['edit', 'update']]);
        $this->middleware('permission:rfp-usage-delete', ['only' => ['destroy']]);
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
            'description' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $category = RfpCategory::findOrFail($validated['rfp_category_id']);
        $validated['code'] = $this->generateNextCode($category);

        $usage = RfpUsage::create($validated);

        return redirect()->route('rfp.usages.index')
            ->with('success', "Usage {$usage->description} created successfully.");
    }

    public function nextCode(Request $request)
    {
        $request->validate([
            'rfp_category_id' => 'required|exists:mysql_rfp.rfp_categories,id',
        ]);

        $category = RfpCategory::findOrFail($request->rfp_category_id);

        return response()->json([
            'code' => $this->generateNextCode($category),
        ]);
    }

    private function generateNextCode(RfpCategory $category): string
    {
        $prefix = strtoupper($category->code);

        $lastUsage = RfpUsage::withTrashed()
            ->where('code', 'like', "{$prefix}-%")
            ->orderByRaw('CAST(SUBSTRING_INDEX(code, "-", -1) AS UNSIGNED) DESC')
            ->first();

        $nextNumber = 1;
        if ($lastUsage) {
            $lastNumber = (int) substr($lastUsage->code, strrpos($lastUsage->code, '-') + 1);
            $nextNumber = $lastNumber + 1;
        }

        return $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
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
            'description' => 'required|string',
            'is_active' => 'boolean',
        ]);

        // code intentionally excluded — immutable after creation
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
