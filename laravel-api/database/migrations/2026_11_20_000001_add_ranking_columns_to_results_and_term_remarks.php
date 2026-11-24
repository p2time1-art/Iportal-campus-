<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('results')) {
            Schema::table('results', function (Blueprint $table) {
                if (! Schema::hasColumn('results', 'subject_position')) {
                    $table->unsignedInteger('subject_position')->nullable()->after('grade');
                }
                if (! Schema::hasColumn('results', 'subject_class_size')) {
                    $table->unsignedInteger('subject_class_size')->nullable()->after('subject_position');
                }
                if (! Schema::hasColumn('results', 'subject_average')) {
                    $table->decimal('subject_average', 6, 2)->nullable()->after('subject_class_size');
                }
                if (! Schema::hasColumn('results', 'subject_highest')) {
                    $table->decimal('subject_highest', 6, 2)->nullable()->after('subject_average');
                }
                if (! Schema::hasColumn('results', 'subject_lowest')) {
                    $table->decimal('subject_lowest', 6, 2)->nullable()->after('subject_highest');
                }
            });
        }

        if (Schema::hasTable('term_remarks')) {
            Schema::table('term_remarks', function (Blueprint $table) {
                if (! Schema::hasColumn('term_remarks', 'class_id')) {
                    $table->unsignedBigInteger('class_id')->nullable()->after('term_id')->index();
                }
                if (! Schema::hasColumn('term_remarks', 'overall_total')) {
                    $table->decimal('overall_total', 8, 2)->nullable()->after('teacher_id');
                }
                if (! Schema::hasColumn('term_remarks', 'overall_average')) {
                    $table->decimal('overall_average', 6, 2)->nullable()->after('overall_total');
                }
                if (! Schema::hasColumn('term_remarks', 'subjects_count')) {
                    $table->unsignedInteger('subjects_count')->nullable()->after('overall_average');
                }
                if (! Schema::hasColumn('term_remarks', 'class_position')) {
                    $table->unsignedInteger('class_position')->nullable()->after('subjects_count');
                }
                if (! Schema::hasColumn('term_remarks', 'class_size')) {
                    $table->unsignedInteger('class_size')->nullable()->after('class_position');
                }
                if (! Schema::hasColumn('term_remarks', 'class_teacher_remark')) {
                    $table->text('class_teacher_remark')->nullable()->after('comment');
                }
                if (! Schema::hasColumn('term_remarks', 'principal_remark')) {
                    $table->text('principal_remark')->nullable()->after('class_teacher_remark');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('results')) {
            Schema::table('results', function (Blueprint $table) {
                $cols = ['subject_position', 'subject_class_size', 'subject_average', 'subject_highest', 'subject_lowest'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('results', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('term_remarks')) {
            Schema::table('term_remarks', function (Blueprint $table) {
                $cols = ['class_id', 'overall_total', 'overall_average', 'subjects_count', 'class_position', 'class_size', 'class_teacher_remark', 'principal_remark'];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('term_remarks', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
