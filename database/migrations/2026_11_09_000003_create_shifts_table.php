<?php

use App\Enums\ShiftStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            // null — «своя смена»; время всё равно хранится в самой смене
            $table->foreignId('shift_template_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status')->default(ShiftStatus::Draft->value);
            $table->timestamps();

            // одна смена на сотрудника в день; на этот же индекс опирается upsert в ShiftSyncService
            $table->unique(['employee_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
