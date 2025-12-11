import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("RACI_DATABASE_URL", "sqlite:///./raci.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_session() -> Generator:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_db() -> Generator:
    with get_session() as session:
        yield session
