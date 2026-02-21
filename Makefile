.PHONY: up down clean ps logs build api-shell web-shell worker-shell migrate seed test

up:
	docker compose up -d --build

down:
	docker compose down

clean:
	docker compose down -v

ps:
	docker compose ps

logs:
	docker compose logs -f api web worker

build:
	docker compose build

api-shell:
	docker compose exec api sh

web-shell:
	docker compose exec web sh

worker-shell:
	docker compose exec worker sh

migrate:
	docker compose exec api pnpm prisma migrate deploy

seed:
	docker compose exec api pnpm prisma db seed

test:
	docker compose exec api pnpm test
	docker compose exec web pnpm test
