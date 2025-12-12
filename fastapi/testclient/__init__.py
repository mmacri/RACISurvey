from dataclasses import asdict, is_dataclass
from typing import Any


def _serialize(obj: Any):
    if is_dataclass(obj):
        return {k: _serialize(v) for k, v in asdict(obj).items()}
    if isinstance(obj, list):
        return [_serialize(o) for o in obj]
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    return obj


class Response:
    def __init__(self, data: Any):
        self._data = _serialize(data)

    def json(self):
        return self._data


class TestClient:
    def __init__(self, app):
        self.app = app

    def _call(self, method: str, path: str, json: Any = None):
        route = self._match_route(method, path)
        if route is None:
            raise ValueError(f"Route {method} {path} not found")
        func, params = route
        payload = json or {}
        return Response(func(**params, payload=payload) if "payload" in func.__code__.co_varnames else func(**params, **payload))

    def _match_route(self, method: str, path: str):
        for registered_method, pattern, func in self.app.routes:
            if registered_method != method:
                continue
            params = {}
            pattern_parts = pattern.strip("/").split("/")
            path_parts = path.strip("/").split("/")
            if len(pattern_parts) != len(path_parts):
                continue
            matched = True
            for pat, actual in zip(pattern_parts, path_parts):
                if pat.startswith("{") and pat.endswith("}"):
                    key = pat.strip("{}"); params[key] = int(actual) if actual.isdigit() else actual
                elif pat != actual:
                    matched = False
                    break
            if matched:
                return func, params
        return None

    def get(self, path: str):
        return self._call("GET", path)

    def post(self, path: str, json=None):
        return self._call("POST", path, json=json)
