<?php

use Illuminate\Support\Facades\Route;

// Единственная Blade-страница — оболочка для Vue SPA.
// Все не-API пути отдают её, дальше маршрутизацией занимается vue-router.
Route::view('/{any?}', 'app')
    ->where('any', '^(?!api(/|$)).*')
    ->name('spa');
