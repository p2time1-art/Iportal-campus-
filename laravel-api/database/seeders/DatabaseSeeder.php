<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new \LogicException('The iPortal development seeders are restricted to the local environment.');
        }

        $this->call(RoleAndPermissionSeeder::class);

        if (app()->environment('local') && filter_var(env('IPORTAL_SEED_DEVELOPMENT_DATA', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->call(DevelopmentDataSeeder::class);
        }
    }
}
