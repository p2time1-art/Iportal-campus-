<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add 'waived' to student_charges.status enum
        DB::statement("ALTER TABLE student_charges MODIFY COLUMN status ENUM('pending','partial','paid','overdue','waived','cancelled') NOT NULL DEFAULT 'pending'");

        // 2. Add 'code' column to fee_categories if missing
        Schema::table('fee_categories', function (Blueprint $table) {
            if (! Schema::hasColumn('fee_categories', 'code')) {
                $table->string('code', 50)->nullable()->after('name');
            }
        });

        // 3. Add 'due_date' and 'description' columns to fee_structures if missing
        Schema::table('fee_structures', function (Blueprint $table) {
            if (! Schema::hasColumn('fee_structures', 'due_date')) {
                $table->date('due_date')->nullable()->after('is_mandatory');
            }
            if (! Schema::hasColumn('fee_structures', 'description')) {
                $table->text('description')->nullable()->after('due_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fee_categories', function (Blueprint $table) {
            if (Schema::hasColumn('fee_categories', 'code')) {
                $table->dropColumn('code');
            }
        });

        Schema::table('fee_structures', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('fee_structures', 'due_date')) {
                $cols[] = 'due_date';
            }
            if (Schema::hasColumn('fee_structures', 'description')) {
                $cols[] = 'description';
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
