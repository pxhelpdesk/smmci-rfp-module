<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfp_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfp_id')->nullable()->constrained('rfps')->cascadeOnDelete();
            $table->string('code')->unique()->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->enum('user_type', ['Requested By', 'Recommended By', 'Approved By', 'Concurred By'])->nullable();
            $table->boolean('is_signed')->default(false)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfp_signs');
    }
};
