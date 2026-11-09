<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_spa_shell_is_served_for_root()
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('<div id="app"></div>', false);
    }

    public function test_spa_shell_is_served_for_client_side_routes()
    {
        $this->get('/schedule/2026-11')
            ->assertOk()
            ->assertSee('<div id="app"></div>', false);
    }

    public function test_api_returns_json()
    {
        $this->getJson('/api/meta')
            ->assertOk()
            ->assertJson(['name' => config('app.name')]);
    }

    public function test_unknown_api_route_returns_json_404()
    {
        $this->getJson('/api/does-not-exist')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    public function test_protected_api_route_requires_authentication()
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
