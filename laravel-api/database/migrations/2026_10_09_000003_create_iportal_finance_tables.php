<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->unique(['school_id', 'name']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });

        Schema::create('fee_structures', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('fee_category_id');
            $table->string('name', 255);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NGN');
            $table->boolean('auto_apply')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['school_id', 'fee_category_id']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('fee_category_id')->references('id')->on('fee_categories')->cascadeOnDelete();
        });

        Schema::create('student_charges', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('fee_structure_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NGN');
            $table->enum('status', ['pending', 'partial', 'paid', 'overdue', 'cancelled'])->default('pending');
            $table->date('due_date')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['student_id', 'status']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('fee_structure_id')->references('id')->on('fee_structures')->nullOnDelete();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NGN');
            $table->string('payment_method', 50);
            $table->string('gateway', 50)->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'refunded', 'reversed'])->default('pending');
            $table->string('reference_number', 100)->nullable()->unique();
            $table->dateTime('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['school_id', 'status']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('payment_id');
            $table->unsignedBigInteger('student_charge_id');
            $table->decimal('amount', 12, 2);
            $table->dateTime('created_at')->useCurrent();
            $table->unique(['payment_id', 'student_charge_id']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
            $table->foreign('student_charge_id')->references('id')->on('student_charges')->cascadeOnDelete();
        });

        Schema::create('online_payment_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->string('gateway', 50);
            $table->string('gateway_reference', 255)->nullable();
            $table->enum('status', ['initiated', 'pending', 'success', 'failed', 'cancelled'])->default('initiated');
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index('gateway_reference');
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('payment_id')->references('id')->on('payments')->nullOnDelete();
        });

        Schema::create('receipts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('payment_id');
            $table->string('receipt_number', 100)->unique();
            $table->string('file_path', 500)->nullable();
            $table->dateTime('issued_at');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('plan_name', 100);
            $table->enum('status', ['trial', 'active', 'expired', 'cancelled'])->default('trial');
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->decimal('amount', 12, 2)->default(0.00);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['school_id', 'status']);
            $table->foreign('school_id')->references('id')->on('schools')->nullOnDelete();
        });

        Schema::create('platform_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('tx_type', 50);
            $table->string('reference', 100)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NGN');
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->foreign('school_id')->references('id')->on('schools')->nullOnDelete();
        });

        Schema::create('payment_gateway_configs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('gateway_name', 100);
            $table->string('public_key', 255)->nullable();
            $table->text('secret_key_ciphertext')->nullable();
            $table->boolean('is_active')->default(false);
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->unique(['school_id', 'gateway_name']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_configs');
        Schema::dropIfExists('platform_transactions');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('online_payment_transactions');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('student_charges');
        Schema::dropIfExists('fee_structures');
        Schema::dropIfExists('fee_categories');
    }
};
