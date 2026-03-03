<?php

namespace App\Http\Controllers;

use App\Models\RfpCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RfpCategoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfp-category-list', only: ['index', 'show']),
            new Middleware('permission:rfp-category-create', only: ['create', 'store']),
            new Middleware('permission:rfp-category-edit', only: ['edit', 'update']),
            new Middleware('permission:rfp-category-delete', only: ['destroy']),
        ];
    }

    public function index()
    {
        $categories = RfpCategory::withCount('usages')
            ->latest()
            ->paginate(15);

        return Inertia::render('rfp/categories/index', [
            'categories' => $categories
        ]);
    }

    public function create()
    {
        return Inertia::render('rfp/categories/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:mysql_rfp.rfp_categories,code',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = RfpCategory::create($validated);

        return redirect()->route('rfp.categories.index')
            ->with('success', "Category {$category->name} created successfully.");
    }

    public function show(RfpCategory $category)
    {
        $category->load(['usages' => function($query) {
            $query->latest();
        }]);

        return Inertia::render('rfp/categories/show', [
            'category' => $category
        ]);
    }

    public function edit(RfpCategory $category)
    {
        return Inertia::render('rfp/categories/edit', [
            'category' => $category
        ]);
    }

    public function update(Request $request, RfpCategory $category)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:mysql_rfp.rfp_categories,code,' . $category->id,
            'name' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->route('rfp.categories.index')
            ->with('success', "Category {$category->name} updated successfully.");
    }

    public function destroy(RfpCategory $category)
    {
        $categoryName = $category->name;
        $category->delete();

        return redirect()->route('rfp.categories.index')
            ->with('success', "Category {$categoryName} deleted successfully.");
    }
}
