<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\RfpCategoryController;
use App\Http\Controllers\RfpUsageController;
use App\Http\Controllers\RfpCurrencyController;
use App\Http\Controllers\RfpRecordController;
use App\Http\Controllers\SapController;
use App\Http\Controllers\SapSupplierController;
use App\Http\Controllers\RfpApprovalMatrixController;
use App\Http\Controllers\RfpDashboardController;

Route::get('/', function () { return redirect()->away('https://portal.silanganmining.com.ph'); })->name('home');
Route::get('/login', function () { return redirect()->away('https://portal.silanganmining.com.ph/login'); })->name('login');
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return Inertia::location('https://portal.silanganmining.com.ph/login');
})->name('logout');

Route::prefix('rfp')->middleware(['auth'])->group(function () {
    Route::name('rfp.')->group(function () {
        Route::get('dashboard', [RfpDashboardController::class, 'index'])->name('dashboard');

        // Records
        Route::resource('records', RfpRecordController::class);
        Route::patch('records/{record}/cancel', [RfpRecordController::class, 'cancel'])->name('records.cancel');
        Route::patch('records/{record}/post', [RfpRecordController::class, 'markAsPosted'])->name('records.post');
        Route::patch('records/{record}/revert', [RfpRecordController::class, 'revert'])->name('records.revert');

        Route::get('approval-matrix', [RfpApprovalMatrixController::class, 'index'])
            ->name('approval-matrix.index');

        Route::get('usages/category/{categoryId}', [RfpRecordController::class, 'getUsagesByCategory'])
            ->name('usages.by-category');

        Route::resource('categories', RfpCategoryController::class);
        Route::resource('usages', RfpUsageController::class);
        Route::resource('currencies', RfpCurrencyController::class);
    });

    // SAP Supplier
    Route::prefix('sap')->name('sap.')->group(function () {
        Route::get('suppliers', [SapSupplierController::class, 'index'])->name('suppliers.index');
        Route::post('suppliers/sync', [SapSupplierController::class, 'sync'])->name('suppliers.sync');
    });

    // API
    Route::prefix('api')->group(function () {
        // SAP Supplier
        Route::prefix('sap')->name('api.sap.')->group(function () {
            Route::get('suppliers', [SapController::class, 'getSuppliers'])->name('suppliers');
        });

        // Users
        Route::get('users/active', function () {
            $users = \App\Models\User::where('is_locked', false)
                ->with('department:id,department')
                ->orderBy('first_name')
                ->get()
                ->map(fn($u) => [
                    'value' => $u->id,
                    'label' => $u->name,
                    'department' => $u->department?->department,
                ]);
            return response()->json($users);
        })->name('api.users.active');

        // SWP PR / RCW lookup
        Route::prefix('swp')->name('api.swp.')->group(function () {
            Route::get('pr', [RfpRecordController::class, 'getSwpPr'])->name('pr');
            Route::get('rcw', [RfpRecordController::class, 'getSwpRcw'])->name('rcw');
        });
    });
});

// require __DIR__.'/settings.php';
