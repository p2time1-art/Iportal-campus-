<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Sanctum::ignoreMigrations();
        if (! $this->app->bound('request') || $this->app['request'] === null) {
            $this->app->instance('request', \Illuminate\Http\Request::create(config('app.url', 'http://localhost:8000')));
        }
    }
}
