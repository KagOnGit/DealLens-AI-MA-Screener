from __future__ import annotations
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config

if config.config_file_name:
    fileConfig(config.config_file_name)

# --- Import Base + models ---
from app.core.database import Base  # noqa
from app.models import user, company, deal  # noqa

target_metadata = Base.metadata

# Inject DB URL from env
db_url = config.get_main_option("sqlalchemy.url")
if not db_url or db_url == "driver://user:pass@localhost/dbname":
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        config.set_main_option("sqlalchemy.url", db_url)
    else:
        # Use a dummy SQLite URL for offline mode/revision generation
        config.set_main_option("sqlalchemy.url", "sqlite:///dummy.db")

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
