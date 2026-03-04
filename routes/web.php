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

Route::prefix('rfp')->group(function () {
    Route::middleware(['auth'])->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('dashboard');
        })->name('dashboard');

        // Records
        Route::resource('records', RfpRecordController::class)->names([
            'index' => 'rfp.records.index',
            'create' => 'rfp.records.create',
            'store' => 'rfp.records.store',
            'show' => 'rfp.records.show',
            'edit' => 'rfp.records.edit',
            'update' => 'rfp.records.update',
            'destroy' => 'rfp.records.destroy',
        ]);

        Route::patch('records/{record}/cancel', [RfpRecordController::class, 'cancel'])->name('rfp.records.cancel');

        // Get usages by category (for dropdown)
        Route::get('usages/category/{categoryId}', [RfpRecordController::class, 'getUsagesByCategory'])
            ->name('rfp.usages.by-category');

        // Categories
        Route::resource('categories', RfpCategoryController::class)->names([
            'index' => 'rfp.categories.index',
            'create' => 'rfp.categories.create',
            'store' => 'rfp.categories.store',
            'show' => 'rfp.categories.show',
            'edit' => 'rfp.categories.edit',
            'update' => 'rfp.categories.update',
            'destroy' => 'rfp.categories.destroy',
        ]);

        // Usages
        Route::resource('usages', RfpUsageController::class)->names([
            'index' => 'rfp.usages.index',
            'create' => 'rfp.usages.create',
            'store' => 'rfp.usages.store',
            'show' => 'rfp.usages.show',
            'edit' => 'rfp.usages.edit',
            'update' => 'rfp.usages.update',
            'destroy' => 'rfp.usages.destroy',
        ]);

        // Currencies
        Route::resource('currencies', RfpCurrencyController::class)->names([
            'index' => 'rfp.currencies.index',
            'create' => 'rfp.currencies.create',
            'store' => 'rfp.currencies.store',
            'show' => 'rfp.currencies.show',
            'edit' => 'rfp.currencies.edit',
            'update' => 'rfp.currencies.update',
            'destroy' => 'rfp.currencies.destroy',
        ]);

        // Suppliers
        Route::get('suppliers', [SapSupplierController::class, 'index'])->name('suppliers.index');

        // SAP API routes
        Route::get('/api/accounts', [SapController::class, 'getAccounts']);
        Route::get('/api/suppliers', [SapController::class, 'getSuppliers']);
    });
});

// require __DIR__.'/settings.php';
