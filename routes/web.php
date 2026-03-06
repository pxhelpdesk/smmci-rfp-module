<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\RfpCategoryController;
use App\Http\Controllers\RfpUsageController;
use App\Http\Controllers\RfpCurrencyController;
use App\Http\Controllers\RfpRecordController;
use App\Http\Controllers\SapController;
use App\Http\Controllers\SapSupplierController;
use App\Http\Controllers\RfpApprovalMatrixController;
use App\Http\Controllers\RfpDashboardController;

// Route::get('/', function () {
//     return Inertia::render('welcome', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');

Route::get('/', function () { return redirect()->away('http://172.17.2.25:8001'); })->name('home');
Route::get('/login', function () { return redirect()->away('http://172.17.2.25:8001/login'); })->name('login');
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return Inertia::location('http://172.17.2.25:8001/login');
})->name('logout');

Route::prefix('rfp')->middleware(['auth'])->group(function () {
    Route::name('rfp.')->group(function () {
        Route::get('dashboard', [RfpDashboardController::class, 'index'])->name('dashboard');

        // Records
        Route::resource('records', RfpRecordController::class);
        Route::patch('records/{record}/cancel', [RfpRecordController::class, 'cancel'])->name('records.cancel');
        Route::patch('records/{record}/paid', [RfpRecordController::class, 'markAsPaid'])->name('records.paid');
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
    });

    // API SAP Supplier
    Route::prefix('api')->group(function () {
        Route::prefix('sap')->name('api.sap.')->group(function () {
            Route::get('suppliers', [SapController::class, 'getSuppliers'])->name('suppliers');
        });
    });
});

// require __DIR__.'/settings.php';
