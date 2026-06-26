<?php

namespace App\Http\Controllers;

use App\Models\SapSupplier;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\JsonResponse;

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

    public function sync(): JsonResponse
    {
        $exitCode = Artisan::call('sap:sync-suppliers');

        if ($exitCode !== 0) {
            return response()->json([
                'message' => 'Failed to sync suppliers from SAP.',
            ], 500);
        }

        return response()->json([
            'message' => 'Suppliers synced successfully.',
        ]);
    }
}
