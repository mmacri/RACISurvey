import inspect
from dataclasses import is_dataclass, asdict
from typing import Any, List


def _serialize(obj: Any):
    if is_dataclass(obj):
        return {k: _serialize(v) for k, v in asdict(obj).items()}
    if hasattr(obj, "__dict__") and not isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    if isinstance(obj, list):
        return [_serialize(o) for o in obj]
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    return obj


class Response:
    def __init__(self, data: Any):
        self._data = _serialize(data)
        self.text = data if isinstance(data, str) else None

    def json(self):
        return self._data


class TestClient:
    def __init__(self, app):
        self.app = app
        for handler in getattr(app, "startup_handlers", []):
            handler()

    def _resolve_dependencies(self, func):
        bound = {}
        sig = inspect.signature(func)
        for name, param in sig.parameters.items():
            default = param.default
            if default.__class__.__name__ == "Depends":
                dep_fn = self.app.dependency_overrides.get(default.dependency, default.dependency)
                dep_value = dep_fn()
                if inspect.isgenerator(dep_value):
                    dep_value = next(dep_value)
                bound[name] = dep_value
        return bound

    def _call(self, method: str, path: str, json: Any = None, params: dict = None):
        route = self._match_route(method, path)
        if route is None:
            raise ValueError(f"Route {method} {path} not found")
        func, path_params = route
        payload = json or {}
        query_params = params or {}
        sig = inspect.signature(func)
        kwargs = {**path_params, **query_params}
        kwargs.update(self._resolve_dependencies(func))
        if "payload" in sig.parameters:
            param = sig.parameters["payload"]
            model = param.annotation
            try:
                from pydantic import BaseModel  # type: ignore
            except Exception:
                BaseModel = object
            try:
                from typing import get_origin, get_args
            except ImportError:  # pragma: no cover
                get_origin = get_args = lambda x: None
            origin = get_origin(model)
            args = get_args(model) if callable(get_args) else []
            if origin in (list, List) and args and isinstance(args[0], type) and issubclass(args[0], BaseModel):
                kwargs["payload"] = [args[0](**item) for item in payload]
            elif isinstance(model, type) and issubclass(model, BaseModel):
                kwargs["payload"] = model(**payload)
            else:
                kwargs["payload"] = payload
        else:
            kwargs.update(payload)
        result = func(**kwargs)
        return Response(result)

    def _match_route(self, method: str, path: str):
        for route in self.app.routes:
            if route["method"] != method:
                continue
            params = {}
            pattern_parts = route["path"].strip("/").split("/")
            path_parts = path.strip("/").split("/")
            if len(pattern_parts) != len(path_parts):
                continue
            matched = True
            for pat, actual in zip(pattern_parts, path_parts):
                if pat.startswith("{") and pat.endswith("}"):
                    key = pat.strip("{}")
                    params[key] = int(actual) if actual.isdigit() else actual
                elif pat != actual:
                    matched = False
                    break
            if matched:
                return route["func"], params
        return None

    def get(self, path: str, params: dict = None):
        return self._call("GET", path, params=params)

    def post(self, path: str, json=None, params: dict = None):
        return self._call("POST", path, json=json, params=params)
