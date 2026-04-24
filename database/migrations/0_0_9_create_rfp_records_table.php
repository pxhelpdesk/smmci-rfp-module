<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->create('rfp_records', function (Blueprint $table) {
            $table->id();

            $table->string('rfp_number')->unique();

            $table->unsignedBigInteger('prepared_by')->nullable();

            $table->enum('office', ['head_office', 'mine_site'])->default('mine_site');
            $table->foreignId('rfp_currency_id')->constrained('rfp_currencies');

            $table->enum('payee_type', ['employee', 'supplier'])->default('supplier');
            $table->string('employee_code')->nullable();
            $table->string('employee_name')->nullable();
            $table->string('supplier_code')->nullable();
            $table->string('supplier_name')->nullable();
            $table->string('vendor_ref')->nullable();

            $table->string('ap_no')->nullable();
            $table->date('due_date');
            $table->string('rr_no')->nullable();
            $table->string('po_no')->nullable();
            $table->string('swp_pr_no')->nullable();
            $table->string('swp_rcw_no')->nullable();

            $table->decimal('subtotal_details_amount', 15, 2)->nullable();

            $table->text('purpose');
            $table->enum('status', ['cancelled', 'draft', 'posted'])->default('draft');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('rfp_records');
    }
};
