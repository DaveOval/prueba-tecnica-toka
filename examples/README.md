# Documentos de Ejemplo

Este directorio contiene documentos PDF de ejemplo que pueden ser utilizados para probar la funcionalidad de vectorización y RAG (Retrieval-Augmented Generation).

## Archivos Disponibles

- **aviones_rag.pdf**: Documento de ejemplo sobre aviones que puede ser vectorizado y usado para pruebas de RAG.

## Uso

1. Acceder a la aplicación en `http://localhost:5173`
2. Iniciar sesión con las credenciales de administrador
3. Navegar a la sección de "Documentos" o "AI Documents"
4. Subir el archivo PDF usando el formulario de carga
5. Esperar a que el documento sea procesado y vectorizado
6. Una vez procesado, el documento estará disponible para consultas en el chat con IA

## Notas

- Los PDFs deben tener un tamaño máximo de 50MB (configurable en `MAX_FILE_SIZE_MB`)
- Solo se aceptan archivos con extensión `.pdf`
- El procesamiento puede tardar varios segundos dependiendo del tamaño del documento
