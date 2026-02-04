<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RfpUsageSeeder extends Seeder
{
    public function run(): void
    {
        $usages = [
            // Utilities (UTIL)
            ['rfp_category_id' => 1, 'code' => 'UTIL-001', 'description' => 'Power Supply Payment'],
            ['rfp_category_id' => 1, 'code' => 'UTIL-002', 'description' => 'Telecommunications Payment'],
            ['rfp_category_id' => 1, 'code' => 'UTIL-003', 'description' => 'Consultancy Services Payment'],

            // Services/Professional Fees (SERV)
            ['rfp_category_id' => 2, 'code' => 'SERV-001', 'description' => 'Medical Services Payment'],
            ['rfp_category_id' => 2, 'code' => 'SERV-002', 'description' => 'Medical Care Services Payment for Executive Check Up / Industrial Accident Cases'],
            ['rfp_category_id' => 2, 'code' => 'SERV-003', 'description' => 'Managers Medical Assistance Payment'],
            ['rfp_category_id' => 2, 'code' => 'SERV-004', 'description' => 'Canteen / Catering Services Payments'],

            // Government Agencies and Payroll (GOVT)
            ['rfp_category_id' => 3, 'code' => 'GOVT-001', 'description' => 'Government Taxes / Permits Payment'],
            ['rfp_category_id' => 3, 'code' => 'GOVT-002', 'description' => 'Employee Retirement Adjustment and Proportionate Benefits Payment'],
            ['rfp_category_id' => 3, 'code' => 'GOVT-003', 'description' => 'SMMCI Remittances of Collections through Payroll deductions to Philex Cooperatives and etc.'],

            // Advances/Down payments (ADVN)
            ['rfp_category_id' => 4, 'code' => 'ADVN-001', 'description' => 'Down payments / Advance Payments for Materials and Supplies'],
            ['rfp_category_id' => 4, 'code' => 'ADVN-002', 'description' => 'Contractors\' Advance Payment'],

            // Others (OTHR)
            ['rfp_category_id' => 5, 'code' => 'OTHR-001', 'description' => 'Cash On Delivery of Materials and Supplies Payments'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-002', 'description' => 'Dollar Denominated Local Purchases of Materials and Supplies Payments'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-003', 'description' => 'Medical Supplies'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-004', 'description' => 'Social Development Management Plan Projects (thru Contracts) Payments'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-005', 'description' => 'Seminar Payments'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-006', 'description' => 'Revolving Fund / Payroll Fund / Petty Cash Replenishment'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-007', 'description' => 'Executives and Employees\' Reimbursement'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-008', 'description' => 'Advertisement'],
            ['rfp_category_id' => 5, 'code' => 'OTHR-009', 'description' => 'Donations'],
        ];

        foreach ($usages as $usage) {
            DB::connection('mysql_rfp')->table('rfp_usages')->insert([
                'rfp_category_id' => $usage['rfp_category_id'],
                'code' => $usage['code'],
                'description' => $usage['description'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
