from typing import Any, Callable, Dict, List, Type


class BaseModel:
    metadata = None

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class Metadata:
    def create_all(self, bind=None):
        global STUB_DB, COUNTERS
        STUB_DB.clear()
        COUNTERS.clear()


STUB_DB: Dict[Type, List[Any]] = {}
COUNTERS: Dict[Type, int] = {}


def declarative_base():
    cls = type("Base", (BaseModel,), {})
    cls.metadata = Metadata()
    return cls


class Session:
    def add(self, obj):
        cls = obj.__class__
        if cls not in STUB_DB:
            STUB_DB[cls] = []
        if cls not in COUNTERS:
            COUNTERS[cls] = len(STUB_DB.get(cls, [])) + 1
        if getattr(obj, "id", None) is None:
            obj.id = COUNTERS[cls]
            COUNTERS[cls] += 1
        STUB_DB[cls].append(obj)

    def commit(self):
        pass

    def refresh(self, obj):
        pass

    def query(self, model):
        return Query(model)

    def close(self):
        pass


class sessionmaker:
    def __init__(self, autocommit=False, autoflush=False, bind=None):
        self.bind = bind

    def __call__(self):
        return Session()


class Query:
    def __init__(self, model):
        self.model = model
        self.items = list(STUB_DB.get(model, []))

    def filter(self, *conditions):
        filtered = self.items
        for cond in conditions:
            filtered = [item for item in filtered if cond.evaluate(item)]
        clone = Query(self.model)
        clone.items = filtered
        return clone

    def all(self):
        return list(self.items)

    def first(self):
        return self.items[0] if self.items else None

    def delete(self):
        remaining = [item for item in STUB_DB.get(self.model, []) if item not in self.items]
        STUB_DB[self.model] = remaining
        if self.model not in COUNTERS:
            COUNTERS[self.model] = len(remaining) + 1


def relationship(*args, **kwargs):
    return None
