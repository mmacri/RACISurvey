from pathlib import Path


class PlaceholderFormat:
    def __init__(self, type_id: int):
        self.type = type_id


class Placeholder:
    def __init__(self):
        self.text = ""
        self.placeholder_format = PlaceholderFormat(1)


class Shapes:
    def __init__(self):
        self.title = Placeholder()


class Slide:
    def __init__(self):
        self.shapes = Shapes()
        self.placeholders = [Placeholder()]


class Layout:
    pass


class SlideLayouts(list):
    def __getitem__(self, index):
        while len(self) <= index:
            self.append(Layout())
        return super().__getitem__(index)


class Slides(list):
    def add_slide(self, layout):  # noqa: ARG002
        slide = Slide()
        self.append(slide)
        return slide


class Presentation:
    def __init__(self):
        self.slide_layouts = SlideLayouts()
        self.slides = Slides()

    def save(self, filename):
        path = Path(filename)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(f"Slides generated: {len(self.slides)}")

__all__ = ["Presentation"]
