<?php

namespace App\Http\Controllers;

use App\Models\SapSupplier;
use Inertia\Inertia;
use Inertia\Response;

class SapSupplierController extends Controller
{
    public function index(): Response
    {
        $suppliers = SapSupplier::orderBy('card_name')
            ->paginate(15);

        return Inertia::render('rfp/suppliers/index', [
            'suppliers' => $suppliers,
        ]);
    }
}
