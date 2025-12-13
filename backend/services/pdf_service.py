from io import BytesIO
from weasyprint import HTML


def html_to_pdf(html: str) -> bytes:
  pdf_bytes = HTML(string=html).write_pdf()
  return pdf_bytes
