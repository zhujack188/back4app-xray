# back4app-xray

Private Xray node (VLESS + WebSocket + TLS) for Back4App Containers free tier
(0.25 CPU / 256 MB RAM / 100 GB transfer / USA region, no card).

## Deploy

1. Back4App → New App → Containers → Import GitHub Repository.
2. Branch `main`, root `./`, Port `8080`.
3. Environment variables:
   - `UUID` — a fresh UUID for the VLESS client
   - `WS_PATH` — the WebSocket path, e.g. `/tk-<hex>`
   - `XRAY_PORT` — `10001` (optional; default 10001)
4. Deploy. The app gets a public `*.back4app.app` HTTPS endpoint.

## Client

`vless://<UUID>@<host>:443?encryption=none&security=tls&sni=<host>&fp=chrome&type=ws&host=<host>&path=<urlencoded WS_PATH>#Back4App`

Health check: `GET /` or `GET /healthz` → `200 ok`.
