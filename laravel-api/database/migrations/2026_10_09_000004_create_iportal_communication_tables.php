<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('author_id');
            $table->string('title', 255);
            $table->text('body');
            $table->enum('audience', ['all', 'students', 'teachers', 'parents', 'school_admin'])->default('all');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->dateTime('published_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->dateTime('deleted_at')->nullable();
            $table->index(['school_id', 'status']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->string('type', 50);
            $table->string('title', 255);
            $table->text('message');
            $table->dateTime('read_at')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['user_id', 'read_at']);
            $table->foreign('school_id')->references('id')->on('schools')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('notification_recipients', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('notification_id');
            $table->unsignedBigInteger('user_id');
            $table->dateTime('read_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->unique(['notification_id', 'user_id']);
            $table->foreign('notification_id')->references('id')->on('notifications')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('job_vacancies', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('title', 255);
            $table->text('description');
            $table->enum('status', ['draft', 'open', 'closed'])->default('draft');
            $table->dateTime('closing_date')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->foreign('school_id')->references('id')->on('schools')->nullOnDelete();
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('job_vacancy_id');
            $table->string('applicant_name', 255);
            $table->string('email', 255);
            $table->string('phone', 50)->nullable();
            $table->string('resume_path', 500)->nullable();
            $table->enum('status', ['submitted', 'reviewed', 'accepted', 'rejected'])->default('submitted');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->foreign('job_vacancy_id')->references('id')->on('job_vacancies')->cascadeOnDelete();
        });

        Schema::create('admission_applications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->string('applicant_name', 255);
            $table->string('email', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'])->default('draft');
            $table->json('application_data')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['school_id', 'status']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id')->nullable();
            $table->string('owner_model', 100)->nullable();
            $table->unsignedBigInteger('owner_id')->nullable();
            $table->string('document_type', 100);
            $table->string('file_name', 255);
            $table->string('storage_disk', 50);
            $table->string('storage_path', 500);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->enum('status', ['active', 'archived', 'deleted'])->default('active');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['owner_model', 'owner_id']);
            $table->foreign('school_id')->references('id')->on('schools')->nullOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('admission_documents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('admission_application_id');
            $table->unsignedBigInteger('document_id');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->dateTime('created_at')->useCurrent();
            $table->unique(['admission_application_id', 'document_id']);
            $table->foreign('admission_application_id')->references('id')->on('admission_applications')->cascadeOnDelete();
            $table->foreign('document_id')->references('id')->on('documents')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_documents');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('admission_applications');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_vacancies');
        Schema::dropIfExists('notification_recipients');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('announcements');
    }
};
