<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Cache;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // тестам SPA-оболочки не нужен собранный фронт: без этого @vite падает без public/build/manifest.json
        $this->withoutVite();

        // array-кэш по умолчанию хранит значения как есть, а file/database сериализуют
        // и не восстанавливают объекты (cache.serializable_classes = false) — в тестах ведём себя как в проде
        config(['cache.stores.array.serialize' => true]);
        Cache::forgetDriver('array');
    }
}
