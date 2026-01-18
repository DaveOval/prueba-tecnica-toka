from typing import List
import os
from pathlib import Path
from PyPDF2 import PdfReader
from src.application.ports.idocument_processor import IDocumentProcessor


class DocumentProcessor(IDocumentProcessor):
    async def process_file(self, file_path: str) -> List[str]:
        """Extrae texto del archivo y lo divide en chunks"""
        ext = Path(file_path).suffix.lower()

        if ext == ".pdf":
            text = await self._extract_pdf_text(file_path)
        else:
            raise ValueError(f"Only PDF files are supported. Received: {ext}")

        # Dividir en chunks
        return await self.chunk_text(text)

    async def _extract_pdf_text(self, file_path: str) -> str:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    async def _extract_text_file(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    async def chunk_text(
        self, text: str, chunk_size: int = 1000, overlap: int = 200
    ) -> List[str]:
        """Divide el texto en chunks con overlap"""
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]

            # Intentar cortar en un punto lógico (punto, nueva línea)
            if end < len(text):
                last_period = chunk.rfind(".")
                last_newline = chunk.rfind("\n")
                cut_point = max(last_period, last_newline)

                if cut_point > chunk_size * 0.5:  # Si encontramos un buen punto de corte
                    chunk = chunk[: cut_point + 1]
                    end = start + cut_point + 1

            chunks.append(chunk.strip())
            start = end - overlap  # Overlap para mantener contexto

        return [chunk for chunk in chunks if chunk]  # Filtrar chunks vacíos
