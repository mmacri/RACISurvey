from pathlib import Path
from typing import Dict

PDF_DIR = Path(__file__).resolve().parent.parent / "data" / "exports"
PDF_DIR.mkdir(parents=True, exist_ok=True)


def build_pdf(summary: Dict, workshop_id: int) -> Path:
    """Generate a lightweight PDF (fallbacks to text when render engine unavailable)."""
    target = PDF_DIR / f"workshop_{workshop_id}_executive.pdf"
    html = f"""
    <html><body>
    <h1>OT RACI Current State – Executive Readout</h1>
    <p>Workshop ID: {workshop_id}</p>
    <h2>Completion summary</h2>
    <pre>{summary}</pre>
    </body></html>
    """
    try:
        from weasyprint import HTML  # type: ignore

        HTML(string=html).write_pdf(target)
    except Exception:
        target.write_text(f"Executive summary for workshop {workshop_id}\n{summary}")
    return target
