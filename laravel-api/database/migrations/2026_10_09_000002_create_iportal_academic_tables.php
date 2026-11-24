<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('students')) {
            Schema::create('students', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('admission_number', 50)->nullable();
                $table->string('full_name', 255);
                $table->string('email', 255)->nullable();
                $table->string('phone', 50)->nullable();
                $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable();
                $table->date('date_of_birth')->nullable();
                $table->enum('status', ['active', 'inactive', 'graduated', 'transferred', 'suspended'])->default('active');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->dateTime('deleted_at')->nullable();
                $table->unique(['school_id', 'admission_number']);
                $table->index(['school_id', 'user_id']);
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('teachers')) {
            Schema::create('teachers', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('staff_number', 50)->nullable();
                $table->string('full_name', 255);
                $table->string('email', 255)->nullable();
                $table->string('phone', 50)->nullable();
                $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->dateTime('deleted_at')->nullable();
                $table->unique(['school_id', 'staff_number']);
                $table->index(['school_id', 'user_id']);
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('parent_guardians')) {
            Schema::create('parent_guardians', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('full_name', 255);
                $table->string('email', 255)->nullable();
                $table->string('phone', 50)->nullable();
                $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->dateTime('deleted_at')->nullable();
                $table->index(['school_id', 'user_id']);
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('guardian_relationships')) {
            Schema::create('guardian_relationships', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('guardian_id');
                $table->unsignedBigInteger('student_id');
                $table->string('relationship_type', 50)->default('guardian');
                $table->boolean('is_primary')->default(false);
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->unique(['school_id', 'guardian_id', 'student_id']);
                $table->index('student_id');
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('guardian_id')->references('id')->on('parent_guardians')->cascadeOnDelete();
                $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('academic_sessions')) {
            Schema::create('academic_sessions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->string('name', 255);
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->index('school_id');
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('terms')) {
            Schema::create('terms', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('academic_session_id');
                $table->string('name', 255);
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->index('academic_session_id');
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('school_classes')) {
            Schema::create('school_classes', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('academic_session_id');
                $table->string('name', 255);
                $table->string('code', 50)->nullable();
                $table->string('level', 50)->nullable();
                $table->string('arm', 20)->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->dateTime('deleted_at')->nullable();
                $table->unique(['school_id', 'academic_session_id', 'name']);
                $table->index('school_id');
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->string('name', 255);
                $table->string('code', 50)->nullable();
                $table->text('description')->nullable();
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->dateTime('deleted_at')->nullable();
                $table->unique(['school_id', 'name']);
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            });
        }

        $teacherAssignmentsExisted = Schema::hasTable('teacher_assignments');
        if (! $teacherAssignmentsExisted) {
            Schema::create('teacher_assignments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('subject_id');
                $table->unsignedBigInteger('class_id');
                $table->unsignedBigInteger('academic_session_id');
                $table->dateTime('created_at')->useCurrent();
                $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
                $table->unique(
                    ['teacher_id', 'subject_id', 'class_id', 'academic_session_id'],
                    'teacher_assignments_natural_key_unique'
                );
                $table->index('school_id');
                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
                $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
                $table->foreign('class_id')->references('id')->on('school_classes')->cascadeOnDelete();
                $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->cascadeOnDelete();
            });
        } else {
            Schema::table('teacher_assignments', function (Blueprint $table) {
                if (! $this->indexExists('teacher_assignments', 'teacher_assignments_natural_key_unique')) {
                    $table->unique(
                        ['teacher_id', 'subject_id', 'class_id', 'academic_session_id'],
                        'teacher_assignments_natural_key_unique'
                    );
                }
                if (! $this->indexExists('teacher_assignments', 'teacher_assignments_school_id_index')) {
                    $table->index('school_id');
                }
                if (! $this->foreignKeyExists('teacher_assignments_school_id_foreign')) {
                    $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                }
                if (! $this->foreignKeyExists('teacher_assignments_teacher_id_foreign')) {
                    $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
                }
                if (! $this->foreignKeyExists('teacher_assignments_subject_id_foreign')) {
                    $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
                }
                if (! $this->foreignKeyExists('teacher_assignments_class_id_foreign')) {
                    $table->foreign('class_id')->references('id')->on('school_classes')->cascadeOnDelete();
                }
                if (! $this->foreignKeyExists('teacher_assignments_academic_session_id_foreign')) {
                    $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->cascadeOnDelete();
                }
            });
        }

        Schema::create('student_class_memberships', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('academic_session_id');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->unique(
                ['student_id', 'class_id', 'academic_session_id'],
                'student_class_memberships_natural_key_unique'
            );
            $table->index('school_id');
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('academic_session_id')->references('id')->on('academic_sessions')->cascadeOnDelete();
        });

        Schema::create('grading_schemes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->dateTime('deleted_at')->nullable();
            $table->unique(['school_id', 'name']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });

        Schema::create('grading_scheme_components', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('grading_scheme_id');
            $table->string('grade_label', 20);
            $table->decimal('minimum_score', 5, 2);
            $table->decimal('maximum_score', 5, 2);
            $table->string('remark', 255)->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->foreign('grading_scheme_id')->references('id')->on('grading_schemes')->cascadeOnDelete();
        });

        Schema::create('results', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('term_id')->nullable();
            $table->decimal('score', 6, 2);
            $table->string('grade', 20)->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->index(['student_id', 'subject_id']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('school_classes')->nullOnDelete();
            $table->foreign('term_id')->references('id')->on('terms')->nullOnDelete();
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->date('attendance_date');
            $table->enum('status', ['present', 'absent', 'late', 'excused']);
            $table->text('remarks')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->unique(['student_id', 'attendance_date']);
            $table->index(['school_id', 'attendance_date']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('school_classes')->nullOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('subject_id');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->dateTime('due_date')->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->dateTime('deleted_at')->nullable();
            $table->index(['school_id', 'teacher_id']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('school_classes')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
        });

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('assignment_id');
            $table->unsignedBigInteger('student_id');
            $table->text('content')->nullable();
            $table->string('file_path', 500)->nullable();
            $table->enum('status', ['draft', 'submitted', 'graded', 'late'])->default('draft');
            $table->decimal('score', 6, 2)->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->unique(['assignment_id', 'student_id']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('assignment_id')->references('id')->on('assignments')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
        });

        Schema::create('term_remarks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('term_id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->text('comment');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable()->useCurrentOnUpdate();
            $table->unique(['student_id', 'term_id']);
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('term_id')->references('id')->on('terms')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('term_remarks');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('results');
        Schema::dropIfExists('grading_scheme_components');
        Schema::dropIfExists('grading_schemes');
        Schema::dropIfExists('student_class_memberships');
        Schema::dropIfExists('teacher_assignments');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('school_classes');
        Schema::dropIfExists('terms');
        Schema::dropIfExists('academic_sessions');
        Schema::dropIfExists('guardian_relationships');
        Schema::dropIfExists('parent_guardians');
        Schema::dropIfExists('teachers');
        Schema::dropIfExists('students');
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }

    private function foreignKeyExists(string $name): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::getDatabaseName())
            ->where('constraint_name', $name)
            ->where('constraint_type', 'FOREIGN KEY')
            ->exists();
    }
};
