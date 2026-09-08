# MCP Gateway

MCP Gateway — единая безопасная точка, через которую workflow вызывает MCP-сервисы. Gateway выбирает
адрес по имени коннектора, разрешает только заданные tools и нормализует ответ. Он не решает, нужно ли
выполнять действие, не показывает виджеты и не содержит правила календаря.

## Что уже работает

- HTTP `POST /api/v1/calls` и health check `GET /health`;
- OIDC-проверка подписи, issuer, audience, срока токена, `tenant_id` и scope;
- allowlist коннекторов и tools из `MCP_CONNECTORS_JSON`;
- MCP Streamable HTTP через официальный TypeScript SDK v2;
- ограничение полного времени вызова;
- безопасные публичные ошибки без ответа внешнего провайдера;
- unit и HTTP-тесты, строгий TypeScript, ESLint, Prettier и coverage gate.

## Стек

Node.js 24, TypeScript 6, Fastify 5, официальный MCP TypeScript SDK 2, Zod 4, jose 6, Vitest 5,
pnpm 10 и Docker.

## Локальный запуск

```powershell
Copy-Item .env.example .env
$env:MCP_CONNECTORS_JSON='[{"name":"fake-calendar","url":"http://localhost:18082/mcp","tools":["create_event"]}]'
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Все настройки читаются из окружения. `.env` не попадает в Git. Для реального вызова нужен JWT с
audience `mcp-gateway`, scope `mcp:call`, UUID в `tenant_id` и правами целевого MCP-сервиса.

## Все проверки

```powershell
corepack pnpm lint
corepack pnpm build
corepack pnpm test
pwsh ./scripts/check-docs.ps1
docker build -t mcp-gateway:local .
```

## Документация

- [Карточка сервиса](SERVICE.md)
- [Архитектура](docs/architecture.md)
- [Разработка](docs/development.md)
- [Runbook](docs/runbook.md)
- [Правила для агентов](AGENTS.md)

## Лицензия

Apache License 2.0.
