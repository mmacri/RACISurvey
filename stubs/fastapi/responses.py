class PlainTextResponse(str):
    def __new__(cls, content: str, *args, **kwargs):
        return str.__new__(cls, content)


class HTMLResponse(str):
    def __new__(cls, content: str, *args, **kwargs):
        return str.__new__(cls, content)


class JSONResponse(dict):
    def __init__(self, content, *args, **kwargs):
        super().__init__(content)
