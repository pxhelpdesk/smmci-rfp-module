<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfp_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfp_id')->nullable()->constrained('rfps')->cascadeOnDelete();
            $table->string('account_code')->nullable();
            $table->string('payment_type')->nullable();
            $table->decimal('billed_amount', 15, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfp_items');
    }
};
