from typing import Optional
from src.domain.entities.document import Document, DocumentStatus
from src.domain.repositories.idocument_repository import IDocumentRepository
from src.application.ports.ievent_publisher import IEventPublisher
import uuid
import os


class UploadDocumentUseCase:
    def __init__(
        self,
        document_repository: IDocumentRepository,
        event_publisher: IEventPublisher,
        upload_dir: str,
    ):
        self.document_repository = document_repository
        self.event_publisher = event_publisher
        self.upload_dir = upload_dir

    async def execute(
        self, user_id: str, file_name: str, file_path: str, description: Optional[str] = None
    ) -> Document:
        # Crear entidad de documento
        document = Document(
            id=str(uuid.uuid4()),
            name=file_name,
            user_id=user_id,
            status=DocumentStatus.PENDING,
            file_path=file_path,
            description=description,
            size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        )

        # Guardar en base de datos
        document = await self.document_repository.create(document)

        # Publicar evento para procesamiento asíncrono
        await self.event_publisher.publish(
            "document.uploaded",
            {
                "documentId": document.id,
                "userId": user_id,
                "filePath": file_path,
                "fileName": file_name,
            },
        )

        return document
