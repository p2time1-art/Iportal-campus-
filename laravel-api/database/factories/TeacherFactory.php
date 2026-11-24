<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    protected $model = Teacher::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'staff_number' => fake()->unique()->bothify('STAFF-####??'),
            'full_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'status' => 'active',
        ];
    }
}
