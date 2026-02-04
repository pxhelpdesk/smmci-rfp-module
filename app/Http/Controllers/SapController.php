<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use App\Models\SapSupplier;

class SapController extends Controller
{
    public function getAccounts()
    {
        $accounts = DB::connection('sqlsrv')
            ->table('OACT')
            ->select('AcctCode', 'AcctName')
            ->get()
            ->map(fn($account) => [
                'value' => $account->AcctCode,
                'label' => "{$account->AcctCode} - {$account->AcctName}"
            ]);

        return response()->json($accounts);
    }

    public function getSuppliers()
    {
        $suppliers = SapSupplier::select('card_code', 'card_name')
            ->orderBy('card_name')
            ->get()
            ->map(fn($supplier) => [
                'value' => $supplier->card_code,
                'label' => "{$supplier->card_code} - {$supplier->card_name}"
            ]);

        return response()->json($suppliers);
    }
}
