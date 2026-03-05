<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->create('rfp_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfp_record_id')->constrained('rfp_records')->cascadeOnDelete();
            $table->foreignId('rfp_usage_id')->constrained('rfp_usages');
            $table->decimal('total_amount', 15, 2);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('rfp_details');
    }
};
