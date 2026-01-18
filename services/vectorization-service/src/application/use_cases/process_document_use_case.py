from src.domain.entities.document import Document, DocumentStatus
from src.domain.entities.document_chunk import DocumentChunk
from src.domain.repositories.idocument_repository import IDocumentRepository
from src.domain.repositories.ivector_repository import IVectorRepository
from src.application.ports.iembedding_service import IEmbeddingService
from src.application.ports.idocument_processor import IDocumentProcessor
from src.application.ports.ievent_publisher import IEventPublisher
import uuid


class ProcessDocumentUseCase:
    def __init__(
        self,
        document_repository: IDocumentRepository,
        vector_repository: IVectorRepository,
        embedding_service: IEmbeddingService,
        document_processor: IDocumentProcessor,
        event_publisher: IEventPublisher,
        collection_name: str,
    ):
        self.document_repository = document_repository
        self.vector_repository = vector_repository
        self.embedding_service = embedding_service
        self.document_processor = document_processor
        self.event_publisher = event_publisher
        self.collection_name = collection_name

    async def execute(self, document_id: str) -> Document:
        # Obtener documento
        document = await self.document_repository.get_by_id(document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")

        # Actualizar estado a procesando
        document.status = DocumentStatus.PROCESSING
        document = await self.document_repository.update(document)

        try:
            # Procesar archivo y obtener chunks de texto
            text_chunks = await self.document_processor.process_file(document.file_path)

            # Generar embeddings para todos los chunks
            embeddings = await self.embedding_service.generate_embeddings_batch(text_chunks)

            # Crear entidades DocumentChunk
            document_chunks = []
            for idx, (text, embedding) in enumerate(zip(text_chunks, embeddings)):
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    chunk_index=idx,
                    content=text,
                    embedding=embedding,
                    metadata={"document_name": document.name},
                )
                document_chunks.append(chunk)

            # Guardar chunks en vector DB
            await self.vector_repository.upsert_chunks(self.collection_name, document_chunks)

            # Actualizar documento como completado
            document.status = DocumentStatus.COMPLETED
            document.chunks = len(document_chunks)
            document = await self.document_repository.update(document)

            # Publicar evento de completado
            await self.event_publisher.publish(
                "document.processed",
                {
                    "documentId": document.id,
                    "userId": document.user_id,
                    "chunks": document.chunks,
                    "status": "completed",
                },
            )

            return document

        except Exception as e:
            # Marcar como fallido
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)
            document = await self.document_repository.update(document)

            # Publicar evento de error
            await self.event_publisher.publish(
                "document.processing.failed",
                {
                    "documentId": document.id,
                    "userId": document.user_id,
                    "error": str(e),
                },
            )

            raise
