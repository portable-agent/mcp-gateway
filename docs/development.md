# Разработка

## Требования

- Node.js 24;
- Corepack и pnpm 10.17.1;
- Docker для проверки image;
- PowerShell 7 для docs check.

## TDD

1. Red — маленький тест описывает одно новое правило и падает.
2. Green — минимальная реализация делает тест зелёным.
3. Refactor — упрощаем имена и границы без изменения поведения.

Unit-тесты проверяют config, OIDC, routing и MCP adapter. HTTP-тесты используют `Fastify.inject`, поэтому
не открывают порт. Сквозной тест с настоящим Calendar MCP принадлежит `test-lab`.

## Форматирование

Prettier использует 4 пробела и не создаёт Tab. Команда `pnpm lint` одновременно проверяет ESLint и
форматирование. TypeScript работает в strict-режиме; production build и тесты type-check разделены.
