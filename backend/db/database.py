import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

Base = declarative_base()
_engine = None
SessionLocal = None


def resolve_database_url() -> str:
    return os.getenv("RACI_DATABASE_URL", f"sqlite:///{DATA_DIR / 'raci_workshop.db'}")


def get_engine():
    global _engine, SessionLocal
    db_url = resolve_database_url()
    if _engine is None or str(_engine.url) != db_url:
        connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
        pool = StaticPool if db_url in {"sqlite://", "sqlite:///:memory:"} else None
        _engine = create_engine(db_url, connect_args=connect_args, poolclass=pool)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine


# initialize engine on import
engine = get_engine()

def get_db():
    get_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
