<?php

namespace App\Providers;

use App\Models\ParentGuardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Services\AuthorizationService;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $authorizationService = app(AuthorizationService::class);

        Gate::define('view-school', function (User $user, School $school) use ($authorizationService) {
            return $authorizationService->canAccessSchool($user, (int) $school->id);
        });

        Gate::define('view-student', function (User $user, Student $student) use ($authorizationService) {
            return $authorizationService->canAccessStudent($user, $student);
        });

        Gate::define('view-teacher', function (User $user, Teacher $teacher) use ($authorizationService) {
            return $authorizationService->canAccessTeacher($user, $teacher);
        });

        Gate::define('view-parent', function (User $user, ParentGuardian $guardian) use ($authorizationService) {
            return $authorizationService->canAccessParent($user, $guardian);
        });

        Gate::define('view-class', function (User $user, SchoolClass $schoolClass) use ($authorizationService) {
            return $authorizationService->canAccessClass($user, $schoolClass);
        });
    }
}
