<?php

namespace App\Http\Controllers;

use App\Models\RfpCurrency;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RfpCurrencyController extends Controller
{
    public function index()
    {
        $currencies = RfpCurrency::latest()->paginate(15);

        return Inertia::render('rfp/currencies/index', [
            'currencies' => $currencies
        ]);
    }

    public function create()
    {
        return Inertia::render('rfp/currencies/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:mysql_rfp.rfp_currencies,code',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $currency = RfpCurrency::create($validated);

        return redirect()->route('rfp.currencies.index')
            ->with('success', "Currency {$currency->name} created successfully.");
    }

    public function show(RfpCurrency $currency)
    {
        return Inertia::render('rfp/currencies/show', [
            'currency' => $currency
        ]);
    }

    public function edit(RfpCurrency $currency)
    {
        return Inertia::render('rfp/currencies/edit', [
            'currency' => $currency
        ]);
    }

    public function update(Request $request, RfpCurrency $currency)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:mysql_rfp.rfp_currencies,code,' . $currency->id,
            'name' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $currency->update($validated);

        return redirect()->route('rfp.currencies.index')
            ->with('success', "Currency {$currency->name} updated successfully.");
    }

    public function destroy(RfpCurrency $currency)
    {
        $currencyName = $currency->name;
        $currency->delete();

        return redirect()->route('rfp.currencies.index')
            ->with('success', "Currency {$currencyName} deleted successfully.");
    }
}
