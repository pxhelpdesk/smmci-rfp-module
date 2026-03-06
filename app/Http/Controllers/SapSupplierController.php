<?php

namespace App\Http\Controllers;

use App\Models\SapSupplier;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SapSupplierController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:sap-supplier-view', only: ['index', 'show']),
        ];
    }

    public function index(): Response
    {
        $suppliers = SapSupplier::orderBy('card_name')
            ->paginate(15);

        return Inertia::render('sap/suppliers/index', [
            'suppliers' => $suppliers,
        ]);
    }
}
