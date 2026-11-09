<?php

declare(strict_types=1);

namespace App\Enums;

enum ShiftStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
}
