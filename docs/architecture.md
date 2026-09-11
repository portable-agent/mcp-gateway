# Архитектура

## Поток вызова

```mermaid
sequenceDiagram
    participant Worker as Temporal worker
    participant Gateway as MCP Gateway
    participant OIDC as OIDC JWKS
    participant MCP as Calendar MCP

    Worker->>Gateway: POST /api/v1/calls + Bearer token
    Gateway->>OIDC: проверить подпись и claims
    OIDC-->>Gateway: публичный ключ
    Note over Gateway: URL выбирается только из config
    Gateway->>Gateway: connector + tool в allowlist
    Gateway->>MCP: tools/call + тот же delegated token
    MCP->>MCP: повторно проверить token и request_key
    MCP-->>Gateway: structuredContent
    Gateway-->>Worker: нормализованный result
```

## Папки

```text
controller -> service -> client -> MCP service
     |           |          |
     v           v          v
   HTTP        model    official SDK

config -> OIDC JWKS
```

Gateway stateless: он не хранит action, сессию диалога или результат. Durable retry принадлежит Temporal.
Gateway намеренно не повторяет изменяющий tool после неизвестного сетевого результата. `requestKey`
передаётся как `request_key`, а конечный MCP-сервис обеспечивает идемпотентность.

Текущий MVP использует delegated token. Он должен содержать audience и scope обеих границ. Перед
подключением внешних пользовательских провайдеров добавляется отдельный RFC для OAuth token exchange;
секреты провайдеров не должны проходить через этот API.
