<?php

namespace Database\Factories;

use App\Models\ParentGuardian;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ParentGuardian>
 */
class ParentGuardianFactory extends Factory
{
    protected $model = ParentGuardian::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'full_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'status' => 'active',
        ];
    }
}
