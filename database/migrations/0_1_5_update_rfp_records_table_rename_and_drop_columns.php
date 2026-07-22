<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->dropColumn('ap_no');
        });

        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->renameColumn('rr_no', 'sap_rr_no');
            $table->renameColumn('po_no', 'sap_po_no');
        });

        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->text('sap_rr_no')->nullable()->change();
            $table->text('sap_po_no')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->string('sap_rr_no')->nullable()->change();
            $table->string('sap_po_no')->nullable()->change();
        });

        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->renameColumn('sap_rr_no', 'rr_no');
            $table->renameColumn('sap_po_no', 'po_no');
        });

        Schema::connection('mysql_rfp')->table('rfp_records', function (Blueprint $table) {
            $table->string('ap_no')->nullable();
        });
    }
};
