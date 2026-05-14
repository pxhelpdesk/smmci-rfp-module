<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class RfpApprovalMatrixController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:rfp-approval-matrix-view', ['only' => ['index']]);
    }

    public function index()
    {
        return Inertia::render('rfp/approval-matrix/index');
    }
}
