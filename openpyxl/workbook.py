import json
from pathlib import Path
from typing import Dict, Generator, Iterable, Optional, Tuple


def _coord_to_index(coord: str) -> Tuple[int, int]:
    letters = ""
    numbers = ""
    for ch in coord:
        if ch.isalpha():
            letters += ch.upper()
        elif ch.isdigit():
            numbers += ch
    col = 0
    for ch in letters:
        col = col * 26 + (ord(ch) - ord("A") + 1)
    row = int(numbers) if numbers else 1
    return row, col


class Cell:
    def __init__(self, value=None):
        self.value = value


class Worksheet:
    def __init__(self, title: str, parent=None):
        self._title = title
        self.parent = parent
        self._cells: Dict[Tuple[int, int], Cell] = {}

    @property
    def title(self):
        return self._title

    @title.setter
    def title(self, value: str):
        if self.parent:
            # rename sheet in parent mapping
            self.parent._sheets.pop(self._title, None)
            self.parent._sheets[value] = self
        self._title = value

    def __setitem__(self, coord: str, value):
        row, col = _coord_to_index(coord)
        self._cells[(row, col)] = Cell(value)

    def __getitem__(self, coord: str) -> Cell:
        row, col = _coord_to_index(coord)
        return self._cells.get((row, col), Cell())

    def iter_rows(self, min_row: int = 1, values_only: bool = False) -> Generator[Tuple, None, None]:
        max_row = max([r for r, _ in self._cells.keys()], default=0)
        max_col = max([c for _, c in self._cells.keys()], default=0)
        for r in range(min_row, max_row + 1):
            row_values = []
            for c in range(1, max_col + 1):
                cell = self._cells.get((r, c))
                row_values.append(cell.value if values_only else cell)
            yield tuple(row_values)

    def append(self, values: Iterable):
        max_row = max([r for r, _ in self._cells.keys()], default=0)
        row_idx = max_row + 1
        for idx, value in enumerate(values, start=1):
            self._cells[(row_idx, idx)] = Cell(value)


class Workbook:
    def __init__(self):
        self._sheets: Dict[str, Worksheet] = {}
        self.active = self.create_sheet("Sheet")

    def create_sheet(self, title: str) -> Worksheet:
        sheet = Worksheet(title, parent=self)
        self._sheets[title] = sheet
        return sheet

    @property
    def sheetnames(self):
        return list(self._sheets.keys())

    def __getitem__(self, name: str) -> Worksheet:
        return self._sheets[name]

    def save(self, filename):
        path = Path(filename)
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {name: {"cells": {f"{r}:{c}": cell.value for (r, c), cell in ws._cells.items()}} for name, ws in self._sheets.items()}
        path.write_text(json.dumps(payload))

    @classmethod
    def load(cls, filename):
        path = Path(filename)
        payload = json.loads(path.read_text())
        wb = cls()
        wb._sheets = {}
        for name, sheet_data in payload.items():
            ws = Worksheet(name, parent=wb)
            for coord, value in sheet_data.get("cells", {}).items():
                row, col = map(int, coord.split(":"))
                ws._cells[(row, col)] = Cell(value)
            wb._sheets[name] = ws
        wb.active = wb._sheets[next(iter(wb._sheets))]
        return wb


def load_workbook(filename, data_only: bool = False):  # noqa: ARG001
    return Workbook.load(filename)
