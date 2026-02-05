<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->create('rfp_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfp_request_id')->constrained('rfp_requests')->cascadeOnDelete();
            $table->string('code')->unique()->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->boolean('is_signed')->default(false);
            $table->text('details')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('rfp_signs');
    }
};
