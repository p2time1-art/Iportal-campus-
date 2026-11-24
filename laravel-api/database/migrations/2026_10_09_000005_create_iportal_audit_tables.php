<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('actor_user_id')->nullable();
            $table->string('event_type', 100);
            $table->string('entity_type', 100)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->index(['school_id', 'event_type']);
            $table->index(['entity_type', 'entity_id']);
            $table->foreign('school_id')->references('id')->on('schools')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('actor_user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('system_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('level', 20);
            $table->string('source', 100);
            $table->text('message');
            $table->json('context')->nullable();
            $table->dateTime('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
        Schema::dropIfExists('audit_logs');
    }
};
