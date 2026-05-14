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

        $baseQuery = RfpRecord::query();

        if (!$user->hasPermissionTo('rfp-record-all')) {
            $sameDeptUserIds = \App\Models\User::where('department_id', $departmentId)
                ->pluck('id')
                ->toArray();

            $signedRfpIds = \App\Models\RfpSign::where('user_id', $userId)
                ->pluck('rfp_record_id')
                ->toArray();

            $baseQuery->where(function ($q) use ($userId, $sameDeptUserIds, $signedRfpIds) {
                $q->where('prepared_by', $userId)
                    ->orWhereIn('prepared_by', $sameDeptUserIds)
                    ->orWhereIn('id', $signedRfpIds);
            });
        }

        $totalRecords     = (clone $baseQuery)->count();
        $totalDraft       = (clone $baseQuery)->where('status', 'draft')->count();
        $totalPosted      = (clone $baseQuery)->where('status', 'posted')->count();
        $totalCancelled   = (clone $baseQuery)->where('status', 'cancelled')->count();
        $totalGrandAmount = (clone $baseQuery)
            ->where('status', '!=', 'cancelled')
            ->sum('subtotal_details_amount');

        $recentRecords = (clone $baseQuery)
            ->with(['currency', 'preparedBy.department'])
            ->where('created_at', '>=', now()->subDays(7))
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'total_records'      => $totalRecords,
                'total_draft'        => $totalDraft,
                'total_posted'       => $totalPosted,
                'total_cancelled'    => $totalCancelled,
                'total_grand_amount' => (float) $totalGrandAmount,
            ],
            'recent_records' => $recentRecords,
        ]);
    }
}
