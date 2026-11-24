<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'admission_number' => fake()->unique()->bothify('ADM-######'),
            'full_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'gender' => fake()->randomElement(['male', 'female', 'other', 'prefer_not_to_say']),
            'date_of_birth' => fake()->dateTimeBetween('-18 years', '-5 years')->format('Y-m-d'),
            'status' => 'active',
        ];
    }
}
