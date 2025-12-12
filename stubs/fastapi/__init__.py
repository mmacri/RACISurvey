import inspect
from typing import Any, Callable, Dict, List, Optional


class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class Depends:
    def __init__(self, dependency: Callable):
        self.dependency = dependency


class FastAPI:
    def __init__(self, title: str = ""):
        self.title = title
        self.routes: List[Dict[str, Any]] = []
        self.middleware: List[Any] = []
        self.dependency_overrides: Dict[Callable, Callable] = {}
        self.startup_handlers: List[Callable] = []

    def add_middleware(self, middleware_class, **kwargs):
        self.middleware.append((middleware_class, kwargs))

    def on_event(self, event: str):
        def decorator(func: Callable):
            if event == "startup":
                self.startup_handlers.append(func)
            return func

        return decorator

    def get(self, path: str, response_model: Optional[Any] = None, response_class: Optional[Any] = None):
        def decorator(func: Callable):
            self.routes.append({"method": "GET", "path": path, "func": func})
            return func

        return decorator

    def post(self, path: str, response_model: Optional[Any] = None, response_class: Optional[Any] = None):
        def decorator(func: Callable):
            self.routes.append({"method": "POST", "path": path, "func": func})
            return func

        return decorator
