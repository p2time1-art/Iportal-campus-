<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add application fee configuration columns to schools (default 5000 NGN, enabled)
        Schema::table('schools', function (Blueprint $table) {
            if (! Schema::hasColumn('schools', 'application_fee_enabled')) {
                $table->boolean('application_fee_enabled')->default(true)->after('subscription_status');
            }
            if (! Schema::hasColumn('schools', 'application_fee_amount')) {
                $table->decimal('application_fee_amount', 12, 2)->default(5000.00)->after('application_fee_enabled');
            }
            if (! Schema::hasColumn('schools', 'metadata')) {
                $table->json('metadata')->nullable()->after('timezone');
            }
        });

        // 2. Expand admission_applications.status enum to support all frontend workflow states
        DB::statement("ALTER TABLE admission_applications MODIFY COLUMN status ENUM('draft','submitted','under_review','approved','accepted','admitted','enrolled','rejected','paid') NOT NULL DEFAULT 'draft'");

        // 3. Normalize existing academic_sessions names to strict YYYY/YYYY format (e.g. 2026/2027)
        $sessions = DB::table('academic_sessions')->get();
        foreach ($sessions as $s) {
            if (preg_match('/(\d{4})\s*[\/\-]\s*(\d{4})/', $s->name, $m)) {
                $normalized = $m[1] . '/' . $m[2];
            } else {
                $year = (int) date('Y');
                $normalized = $year . '/' . ($year + 1);
            }
            if ($s->name !== $normalized) {
                DB::table('academic_sessions')->where('id', $s->id)->update(['name' => $normalized]);
            }

            // Ensure all 3 terms exist for active sessions
            if ($s->status === 'active') {
                $existingTerms = DB::table('terms')
                    ->where('school_id', $s->school_id)
                    ->where('academic_session_id', $s->id)
                    ->pluck('name')
                    ->map(fn ($n) => strtolower(trim($n)))
                    ->toArray();

                $hasActiveTerm = DB::table('terms')
                    ->where('school_id', $s->school_id)
                    ->where('academic_session_id', $s->id)
                    ->where('status', 'active')
                    ->exists();

                foreach (['First Term', 'Second Term', 'Third Term'] as $idx => $termName) {
                    if (! in_array(strtolower($termName), $existingTerms)) {
                        DB::table('terms')->insert([
                            'school_id' => $s->school_id,
                            'academic_session_id' => $s->id,
                            'name' => $termName,
                            'status' => (! $hasActiveTerm && $idx === 0) ? 'active' : 'draft',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        if (! $hasActiveTerm && $idx === 0) {
                            $hasActiveTerm = true;
                        }
                    }
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $cols = [];
            foreach (['application_fee_enabled', 'application_fee_amount', 'metadata'] as $col) {
                if (Schema::hasColumn('schools', $col)) {
                    $cols[] = $col;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
