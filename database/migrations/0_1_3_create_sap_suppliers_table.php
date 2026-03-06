<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->create('sap_suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('card_code')->unique();
            $table->string('card_name');
            $table->text('address')->nullable();
            $table->string('tin')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('sap_suppliers');
    }
};
