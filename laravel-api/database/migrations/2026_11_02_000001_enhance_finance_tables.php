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
        Schema::table('student_charges', function (Blueprint $table) {
            if (!Schema::hasColumn('student_charges', 'academic_session_id')) {
                $table->unsignedBigInteger('academic_session_id')->nullable()->after('fee_structure_id');
                $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->nullOnDelete();
            }
            if (!Schema::hasColumn('student_charges', 'term_id')) {
                $table->unsignedBigInteger('term_id')->nullable()->after('academic_session_id');
                $table->foreign('term_id')->references('id')->on('terms')->nullOnDelete();
            }
            if (!Schema::hasColumn('student_charges', 'discount_amount')) {
                $table->decimal('discount_amount', 12, 2)->default(0.00)->after('amount');
            }
            if (!Schema::hasColumn('student_charges', 'net_amount')) {
                $table->decimal('net_amount', 12, 2)->default(0.00)->after('discount_amount');
            }
            if (!Schema::hasColumn('student_charges', 'notes')) {
                $table->text('notes')->nullable()->after('due_date');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'academic_session_id')) {
                $table->unsignedBigInteger('academic_session_id')->nullable()->after('user_id');
                $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->nullOnDelete();
            }
            if (!Schema::hasColumn('payments', 'term_id')) {
                $table->unsignedBigInteger('term_id')->nullable()->after('academic_session_id');
                $table->foreign('term_id')->references('id')->on('terms')->nullOnDelete();
            }
            if (!Schema::hasColumn('payments', 'notes')) {
                $table->text('notes')->nullable()->after('reference_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_charges', function (Blueprint $table) {
            $table->dropForeign(['academic_session_id']);
            $table->dropForeign(['term_id']);
            $table->dropColumn(['academic_session_id', 'term_id', 'discount_amount', 'net_amount', 'notes']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['academic_session_id']);
            $table->dropForeign(['term_id']);
            $table->dropColumn(['academic_session_id', 'term_id', 'notes']);
        });
    }
};
