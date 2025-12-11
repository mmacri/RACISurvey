from typing import Any
from typing import Any


def Field(default: Any = None, **kwargs):
    return default


class BaseModel:
    def __init__(self, **data):
        for key, value in data.items():
            setattr(self, key, value)

    def dict(self):
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

    class Config:
        orm_mode = True
