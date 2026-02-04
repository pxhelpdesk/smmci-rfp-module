<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->create('rfp_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfp_category_id')->constrained('rfp_categories');
            $table->string('code')->unique();
            $table->text('description');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('rfp_usages');
    }
};
