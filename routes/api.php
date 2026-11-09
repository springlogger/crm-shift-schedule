<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\ShiftTemplateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/meta', fn () => [
    'name' => config('app.name'),
]);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
Route::get('/shift-templates', [ShiftTemplateController::class, 'index'])->name('shift-templates.index');

Route::controller(ShiftController::class)->prefix('shifts')->name('shifts.')->group(function () {
    Route::get('/', 'index')->name('index');
    Route::put('/sync', 'sync')->name('sync');
    Route::post('/publish', 'publish')->name('publish');
});
