<?php

namespace App\Http\Controllers;

use App\Models\RfpRecord;
use Inertia\Inertia;

class RfpDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $userId = $user->id;
        $departmentId = $user->department_id;

        $sameDeptUserIds = \App\Models\User::where('department_id', $departmentId)
            ->pluck('id')
            ->toArray();

        $signedRfpIds = \App\Models\RfpSign::where('user_id', $userId)
            ->pluck('rfp_record_id')
            ->toArray();

        $baseQuery = RfpRecord::where(function ($q) use ($userId, $sameDeptUserIds, $signedRfpIds) {
            $q->where('prepared_by', $userId)
                ->orWhereIn('prepared_by', $sameDeptUserIds)
                ->orWhereIn('id', $signedRfpIds);
        });

        $totalRecords = (clone $baseQuery)->count();
        $totalDraft = (clone $baseQuery)->where('status', 'draft')->count();
        $totalPaid = (clone $baseQuery)->where('status', 'paid')->count();
        $totalCancelled = (clone $baseQuery)->where('status', 'cancelled')->count();
        $totalGrandAmount = (clone $baseQuery)->sum('subtotal_details_amount'); // grand_total_amount

        $overdueCount = (clone $baseQuery)
            ->where('status', 'draft')
            ->whereDate('due_date', '<', now())
            ->count();

        $recentRecords = (clone $baseQuery)
            ->with(['currency', 'preparedBy.department'])
            ->where('created_at', '>=', now()->subDays(7))
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'total_records'     => $totalRecords,
                'total_draft'       => $totalDraft,
                'total_paid'        => $totalPaid,
                'total_cancelled'   => $totalCancelled,
                'total_grand_amount'=> (float) $totalGrandAmount,
                'overdue_count'     => $overdueCount,
            ],
            'recent_records' => $recentRecords,
        ]);
    }
}
