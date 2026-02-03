<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

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
        $suppliers = DB::connection('sqlsrv')
            ->table('OCRD')
            ->where('CardType', 'S')
            ->select('CardCode', 'CardName')
            ->get()
            ->map(fn($supplier) => [
                'value' => $supplier->CardCode,
                'label' => "{$supplier->CardCode} - {$supplier->CardName}"
            ]);

        return response()->json($suppliers);
    }
}
