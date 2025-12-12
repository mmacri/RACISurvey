import string

def get_column_letter(idx: int) -> str:
    letters = ""
    while idx > 0:
        idx, remainder = divmod(idx - 1, 26)
        letters = string.ascii_uppercase[remainder] + letters
    return letters or "A"
