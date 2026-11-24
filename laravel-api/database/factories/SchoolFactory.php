<?php

namespace Database\Factories;

use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<School>
 */
class SchoolFactory extends Factory
{
    protected $model = School::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company().' School',
            'short_name' => fake()->optional()->company(),
            'code' => fake()->unique()->bothify('SCH-####??'),
            'status' => 'active',
            'subscription_status' => 'trial',
            'timezone' => 'UTC',
        ];
    }
}
