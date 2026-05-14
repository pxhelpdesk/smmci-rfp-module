<?php

namespace App\Http\Controllers;

use App\Models\SapSupplier;
use Inertia\Inertia;
use Inertia\Response;

class SapSupplierController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:sap-supplier-view', ['only' => ['index', 'show']]);
    }

    public function index(): Response
    {
        $suppliers = SapSupplier::orderBy('card_name')->get();

        return Inertia::render('sap/suppliers/index', [
            'suppliers' => $suppliers,
        ]);
    }
}
