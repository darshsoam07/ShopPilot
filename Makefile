.PHONY: help dev-api dev-web test migrate seed

help:
	@echo "Targets: dev-api dev-web test migrate seed"

dev-api:
	cd apps/api && python -m uvicorn app.main:app --reload

dev-web:
	cd apps/web && npm run dev

test:
	cd apps/api && python -m pytest -q

migrate:
	cd apps/api && alembic upgrade head

seed:
	cd apps/api && python -m scripts.seed_products
