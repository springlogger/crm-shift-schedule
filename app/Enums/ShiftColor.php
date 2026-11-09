<?php

declare(strict_types=1);

namespace App\Enums;

// совпадает с ShiftColor на фронте (entities/shift/model/colors.ts)
enum ShiftColor: string
{
    case Cornflower = 'cornflower';
    case Mint = 'mint';
    case Lavanda = 'lavanda';
    case Brand = 'brand';
    case Info = 'info';
}
