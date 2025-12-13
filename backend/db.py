from sqlmodel import create_engine, SQLModel, Session
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / 'awe.db'
engine = create_engine(f'sqlite:///{DB_PATH}', echo=False)


def init_db():
  from . import models  # noqa: F401
  SQLModel.metadata.create_all(engine)


def get_session():
  with Session(engine) as session:
    yield session
