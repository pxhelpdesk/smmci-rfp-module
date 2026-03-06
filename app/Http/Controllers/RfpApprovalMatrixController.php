<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RfpApprovalMatrixController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfp-approval-matrix-view', only: ['index']),
        ];
    }

    public function index()
    {
        return Inertia::render('rfp/approval-matrix/index');
    }
}
