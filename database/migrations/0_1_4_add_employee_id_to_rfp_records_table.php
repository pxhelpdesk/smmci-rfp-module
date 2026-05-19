<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->unsignedBigInteger('employee_id')->nullable()->after('payee_type');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->dropColumn('employee_id');
        });
    }
};
