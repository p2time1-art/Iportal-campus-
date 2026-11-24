<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('feature_flags')) {
            Schema::create('feature_flags', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('school_id')->nullable()->index();
                $table->string('feature_key', 80)->index();
                $table->boolean('is_enabled')->default(true);
                $table->unsignedBigInteger('updated_by_user_id')->nullable();
                $table->timestamps();

                $table->unique(['school_id', 'feature_key'], 'feature_flags_school_feature_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
