<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'amount' => fake()->randomFloat(2, 1, 100000),
            'currency' => 'NGN',
            'payment_method' => fake()->randomElement(['cash', 'bank_transfer', 'card']),
            'status' => 'pending',
            'metadata' => [],
        ];
    }
}
