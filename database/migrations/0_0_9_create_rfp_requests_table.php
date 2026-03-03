<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql_rfp')->create('rfp_requests', function (Blueprint $table) {
            $table->id();

            $table->string('rfp_request_number')->unique();

            $table->unsignedBigInteger('prepared_by')->nullable();

            $table->enum('area', ['head_office', 'mine_site'])->default('mine_site');
            $table->foreignId('rfp_currency_id')->constrained('rfp_currencies');
            $table->foreignId('rfp_usage_id')->constrained('rfp_usages');

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
            $table->string('requisition_no')->nullable();
            $table->string('contract_no')->nullable();

            $table->decimal('subtotal_details_amount', 15, 2)->nullable();
            $table->decimal('total_before_vat_amount', 15, 2)->nullable();
            $table->decimal('less_down_payment_amount', 15, 2)->nullable();
            $table->boolean('is_vatable')->nullable();
            $table->enum('vat_type', ['inclusive', 'exclusive'])->nullable();
            $table->decimal('vat_amount', 15, 2)->nullable();
            $table->decimal('wtax_amount', 15, 2)->nullable();
            $table->decimal('grand_total_amount', 15, 2)->nullable();

            $table->text('remarks')->nullable();
            $table->enum('status', ['cancelled', 'draft', 'for_approval', 'approved', 'paid'])->default('draft');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('rfp_requests');
    }
};
