from typing import Callable


class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def Depends(fn: Callable):
    return fn()


class FastAPI:
    def __init__(self, title: str = ""):
        self.title = title
        self.routes = []
        self.middleware = []

    def add_middleware(self, middleware_class, **kwargs):
        self.middleware.append((middleware_class, kwargs))

    def get(self, path: str):
        def decorator(func: Callable):
            self.routes.append(("GET", path, func))
            return func

        return decorator

    def post(self, path: str):
        def decorator(func: Callable):
            self.routes.append(("POST", path, func))
            return func

        return decorator
