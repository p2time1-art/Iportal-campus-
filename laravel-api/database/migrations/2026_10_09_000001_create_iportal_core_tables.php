<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255);
            $table->string('short_name', 100)->nullable();
            $table->string('code', 50)->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('website', 255)->nullable();
            $table->enum('status', ['active', 'inactive', 'pending', 'suspended'])->default('active');
            $table->enum('subscription_status', ['trial', 'active', 'expired', 'cancelled'])->default('trial');
            $table->string('timezone', 64)->default('UTC');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->dateTime('deleted_at')->nullable();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 50);
            $table->string('slug', 50)->unique();
            $table->string('description', 255)->nullable();
            $table->boolean('is_platform_role')->default(false);
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('group_name', 100)->nullable();
            $table->string('description', 255)->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('permission_id');
            $table->dateTime('created_at')->useCurrent();
            $table->unique(['role_id', 'permission_id']);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('email', 255)->nullable()->unique();
            $table->string('password_hash', 255)->nullable();
            $table->string('full_name', 255);
            $table->string('phone', 50)->nullable();
            $table->enum('status', ['active', 'invited', 'disabled', 'suspended'])->default('active');
            $table->dateTime('email_verified_at')->nullable();
            $table->dateTime('password_changed_at')->nullable();
            $table->boolean('must_change_password')->default(false);
            $table->string('login_pin', 50)->nullable()->unique();
            $table->string('platform_pin', 50)->nullable()->unique();
            $table->unsignedBigInteger('active_school_id')->nullable();
            $table->string('active_role', 50)->nullable();
            $table->boolean('is_school_admin')->default(false);
            $table->boolean('is_super_admin')->default(false);
            $table->dateTime('last_login_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->dateTime('deleted_at')->nullable();
            $table->foreign('active_school_id')->references('id')->on('schools')->nullOnDelete();
        });

        Schema::create('user_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('token_hash', 255)->nullable();
            $table->string('login_ip', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('revoked_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('school_memberships', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('school_id');
            $table->string('role', 50);
            $table->enum('status', ['active', 'inactive', 'invited', 'suspended'])->default('active');
            $table->boolean('is_primary')->default(false);
            $table->string('login_pin', 50)->nullable();
            $table->string('user_pin', 50)->nullable();
            $table->string('user_email', 255)->nullable();
            $table->string('user_name', 255)->nullable();
            $table->json('permissions')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->dateTime('deleted_at')->nullable();
            $table->unique(['user_id', 'school_id', 'role']);
            $table->index(['school_id', 'role', 'status']);
            $table->index('user_email');
            $table->index('login_pin');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_memberships');
        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('users');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('schools');
    }
};
