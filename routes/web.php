<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Route::get('/', function () {
//     return Inertia::render('welcome', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');

Route::get('/', function () { return redirect()->away('http://172.17.2.25:8001'); })->name('welcome');
Route::get('/login', function () { return redirect()->away('http://172.17.2.25:8001/login'); })->name('login');
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return Inertia::location('http://172.17.2.25:8001/login');
})->name('logout');

Route::prefix('rfp')->group(function () {
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('dashboard');
        })->name('dashboard');
    });
});

require __DIR__.'/settings.php';
