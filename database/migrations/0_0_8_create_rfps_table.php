<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfps', function (Blueprint $table) {
            $table->id();
            $table->string('rfp_number')->unique()->nullable();
            $table->enum('area', ['Head Office', 'Mine Site'])->default('Mine Site')->nullable();
            $table->foreignId('rfp_form_id')->nullable()->constrained('rfp_forms')->nullOnDelete();
            $table->enum('payee_type', ['Employee', 'Supplier'])->default('Supplier')->nullable();
            $table->string('payee_card_code')->nullable();
            $table->string('payee_card_name')->nullable();
            $table->string('payee_invoice_number')->nullable();

            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('recommended_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('concurred_by')->nullable();

            $table->decimal('subtotal', 15, 2)->nullable();
            $table->decimal('total_before_vat', 15, 2)->nullable();
            $table->boolean('is_vatable')->default(true)->nullable();
            $table->enum('vat_type', ['Inclusive', 'Exclusive'])->default('Inclusive')->nullable();
            $table->decimal('down_payment', 15, 2)->nullable();
            $table->decimal('vat_amount', 15, 2)->nullable();
            $table->decimal('withholding_tax', 15, 2)->nullable();
            $table->decimal('grand_total', 15, 2)->nullable();

            $table->enum('currency', ['Peso', 'US Dollar'])->default('Peso')->nullable();
            $table->text('remarks')->nullable();
            $table->date('due_date')->nullable();
            $table->foreignId('shared_description_id')->nullable()->constrained('shared_descriptions')->nullOnDelete();
            $table->text('purpose')->nullable();
            $table->enum('status', ['Draft', 'Cancelled', 'Final', 'Final with CV', 'Paid'])->default('Draft')->nullable();
            $table->string('voucher_number')->nullable();
            $table->string('check_number')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfps');
    }
};
