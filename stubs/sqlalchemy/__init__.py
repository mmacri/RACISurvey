from .orm import declarative_base, sessionmaker, relationship


class Engine:
    def __init__(self, url: str, **kwargs):
        self.url = url


def create_engine(url: str, connect_args=None):
    return Engine(url, connect_args=connect_args or {})


class Column:
    def __init__(self, type_, primary_key=False, index=False, nullable=True, default=None, ForeignKey=None):
        self.type_ = type_
        self.primary_key = primary_key
        self.index = index
        self.nullable = nullable
        self.default = default
        self.name = None

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__.get(self.name, self.default)

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value

    def __eq__(self, other):
        return Condition(self.name, other, lambda a, b: a == b)

    def in_(self, values):
        return Condition(self.name, values, lambda a, b: a in b)


class Condition:
    def __init__(self, field, expected, comparator):
        self.field = field
        self.expected = expected
        self.comparator = comparator

    def evaluate(self, obj):
        return self.comparator(getattr(obj, self.field), self.expected)


class Integer:
    pass


class String:
    def __init__(self, length: int | None = None):
        self.length = length


class Text:
    pass


class Date:
    pass


class ForeignKey:
    def __init__(self, target):
        self.target = target


__all__ = [
    "create_engine",
    "Engine",
    "Column",
    "Integer",
    "String",
    "Text",
    "Date",
    "ForeignKey",
    "declarative_base",
    "sessionmaker",
    "relationship",
]
