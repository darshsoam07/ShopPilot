"""Opt-in pytest plugin. Creates its own PostgreSQL server; accepts no database URL."""
import os
import secrets
import subprocess
import sys
import time
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL


def docker(*args, **kwargs):
    return subprocess.check_output(["docker", *args], text=True, **kwargs).strip()


@pytest.fixture(scope="session")
def pg_server():
    password = secrets.token_hex(32)
    container = docker("run", "-d", "--rm", "--publish", "127.0.0.1::5432",
                       "--tmpfs", "/var/lib/postgresql/data", "-e", "POSTGRES_PASSWORD",
                       "postgres:16-alpine", env={**os.environ, "POSTGRES_PASSWORD": password})
    try:
        for _ in range(90):
            if subprocess.run(["docker", "exec", container, "pg_isready", "-h", "127.0.0.1"],
                              stdout=subprocess.DEVNULL).returncode == 0:
                break
            time.sleep(1)
        else:
            pytest.fail("Disposable PostgreSQL server failed to start")
        host, port = docker("port", container, "5432/tcp").split(":")
        assert host == "127.0.0.1"
        yield container, password, int(port)
    finally:
        docker("stop", container)


@pytest.fixture
def postgres_seed_engine(pg_server):
    container, password, port = pg_server
    database = "shoppilot_test_" + uuid4().hex
    docker("exec", container, "createdb", "-U", "postgres", database)
    url = URL.create("postgresql+psycopg", "postgres", password, "127.0.0.1", port, database)
    db = create_engine(url)
    try:
        with db.connect() as conn:
            assert conn.scalar(text("select current_database()")) == database
            print("PostgreSQL", conn.scalar(text("show server_version")))
        subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True,
                       env={**os.environ, "DATABASE_URL": url.render_as_string(hide_password=False)})
        yield db
    finally:
        db.dispose()

