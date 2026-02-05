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

            $table->enum('area', ['Head Office', 'Mine Site'])->default('Mine Site');
            $table->foreignId('rfp_currency_id')->constrained('rfp_currencies');
            $table->foreignId('rfp_usage_id')->constrained('rfp_usages');

            $table->enum('payee_type', ['Employee', 'Supplier'])->default('Supplier');
            $table->string('employee_code')->nullable();
            $table->string('employee_name')->nullable();
            $table->string('supplier_code')->nullable();
            $table->string('supplier_name')->nullable();
            $table->string('vendor_ref')->nullable();

            $table->string('ap_no')->nullable();
            $table->date('due_date');
            $table->string('rr_no')->nullable();
            $table->string('po_no')->nullable();

            $table->decimal('details_subtotal_amount', 15, 2)->nullable();
            $table->decimal('total_before_vat_amount', 15, 2)->nullable();
            $table->decimal('less_down_payment_amount', 15, 2)->nullable();
            $table->boolean('is_vatable')->default(true);
            $table->enum('vat_type', ['inclusive', 'exclusive'])->default('inclusive');
            $table->decimal('vat_amount', 15, 2)->nullable();
            $table->decimal('wtax_amount', 15, 2)->nullable();
            $table->decimal('grand_total_amount', 15, 2)->nullable();

            $table->text('remarks')->nullable();
            $table->enum('status', ['cancelled', 'draft', 'for_approval', 'approved', 'paid'])->default('draft');

            $table->timestamp('pdf_generated_at')->nullable();
            $table->unsignedBigInteger('pdf_generated_by')->nullable();
            $table->integer('pdf_generation_count')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql_rfp')->dropIfExists('rfp_requests');
    }
};
