<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        if (! Schema::hasTable('job_batches')) {
            Schema::create('job_batches', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('name');
                $table->integer('total_jobs');
                $table->integer('pending_jobs');
                $table->integer('failed_jobs');
                $table->longText('failed_job_ids');
                $table->mediumText('options')->nullable();
                $table->integer('cancelled_at')->nullable();
                $table->integer('created_at');
                $table->integer('finished_at')->nullable();
            });
        }

        if (! Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->unique();
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('notification_dispatches')) {
            Schema::create('notification_dispatches', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id')->nullable()->index();
                $table->string('batch_id', 64)->nullable()->index();
                $table->string('queue_name', 50)->default('default');
                $table->string('channel', 30)->index(); // email, sms, whatsapp, pdf_batch
                $table->string('provider', 40)->default('log'); // postmark, sendgrid, ses, mailgun, termii, africastalking, twilio, dompdf
                $table->string('template_key', 60)->index(); // welcome_onboarding, password_reset, termly_invoice, admission_acceptance, attendance_absence, fee_payment_reminder, exam_result_release, emergency_school_closure, bulk_report_cards
                $table->string('recipient', 255)->nullable();
                $table->string('recipient_name', 255)->nullable();
                $table->string('subject', 255)->nullable();
                $table->text('message_body')->nullable();
                $table->string('status', 30)->default('queued')->index(); // queued, processing, sent, delivered, completed, failed
                $table->string('provider_message_id', 120)->nullable();
                $table->text('error_message')->nullable();
                $table->json('metadata')->nullable();
                $table->dateTime('dispatched_at')->nullable();
                $table->dateTime('completed_at')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_dispatches');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
    }
};
