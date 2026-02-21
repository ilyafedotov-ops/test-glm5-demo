# Docker Runbook for GLM-5 Benchmark

## 1. Prerequisites
- Docker Desktop (or Docker Engine)
- Docker Compose v2+

## 2. Standard Commands
- Build and start stack:
```bash
docker compose up -d --build
```
- Show status:
```bash
docker compose ps
```
- Follow logs:
```bash
docker compose logs -f api web worker
```
- Run API migrations:
```bash
docker compose exec api pnpm prisma migrate deploy
```
- Seed database:
```bash
docker compose exec api pnpm prisma db seed
```
- Run tests:
```bash
docker compose exec api pnpm test
docker compose exec web pnpm test
```
- Stop:
```bash
docker compose down
```
- Stop + wipe volumes:
```bash
docker compose down -v
```

## 3. Required Services
- `postgres`
- `redis`
- `api`
- `worker`
- `web`

## 4. Verification Checklist
1. `docker compose ps` shows all services `running` (or healthy where configured).
2. API health endpoint returns 200.
3. Web page loads from containerized frontend.
4. Worker consumes queue jobs.
5. Test commands run successfully in containers.

## 5. Troubleshooting
- If containers fail after schema changes, run `docker compose down -v` then rebuild.
- If API cannot connect to DB, confirm DB host is `postgres` (Compose service name).
- If worker is idle, verify Redis URL points to `redis:6379`.
