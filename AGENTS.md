# Памятка по MCP Gateway

Сначала прочитай `SERVICE.md`, README и ADR. Не меняй границу сервиса без нового ADR.

## Слои

- `controller` знает HTTP и вызывает один use case;
- `service` проверяет маршрут и собирает MCP-вызов;
- `client` содержит только работу с официальным MCP SDK;
- `config` читает окружение и проверяет OIDC;
- `model` не зависит от Fastify или MCP SDK.

Не добавляй repository: у stateless gateway нет своих данных. Не переноси сюда правила календаря или
статусы action workflow.

## Стиль и TDD

- используй короткие английские имена: `call`, `tool`, `route`, `token`, `result`;
- отступ — 4 пробела, Tab запрещён;
- сначала падающий тест, затем минимальный код и упрощение;
- не ослабляй coverage gate;
- перед PR запусти все команды из README.

Не добавляй секреты, настоящие токены, персональные данные и production URL. При изменении API обнови
версионный контракт в `portable-agent/contracts`, `SERVICE.md` и runbook.
