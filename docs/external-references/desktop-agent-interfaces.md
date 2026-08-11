> **Created:** 2026-08-11
> **Last Updated:** 2026-08-11

# Desktop Agent Interfaces: Antigravity vs. Claude Code

Este documento sintetiza cómo dos de los principales asistentes de codificación agenticos manejan la orquestación, descubrimiento y selección de subagentes en entornos locales (IDE/Terminal).

## 1. Descubrimiento y Configuración

Ambas plataformas comparten una filosofía de diseño sorprendentemente similar basada en "Configuración Declarativa en Markdown", lo que facilita la portabilidad de los agentes entre ecosistemas.

*   **Antigravity IDE**:
    *   Descubre agentes buscando en la carpeta `.agents/` (o `agents/`) del repositorio local, o globalmente en `~/.gemini/config/`.
    *   Los perfiles se definen en archivos `.md` utilizando YAML Frontmatter para metadatos (nombre, descripción, herramientas) y Markdown estándar para el System Prompt.
*   **Claude Code (CLI/Desktop)**:
    *   Descubre agentes en directorios idénticos: `.claude/agents/` a nivel de proyecto o `~/.claude/agents/` globalmente.
    *   La definición también utiliza archivos Markdown con YAML frontmatter para definir el nombre, modelo, descripción y herramientas permitidas. Dispone de un CLI (como `subagents.sh`) para instalar y actualizar agentes de forma comunitaria.

## 2. Modelos de Ejecución e Interacción (UI)

La principal diferencia radica en cómo el usuario puede interactuar con estos agentes y cómo operan en relación con el "hilo principal" (Main Thread).

### Antigravity (IDE de Escritorio)
*   **Selección Explícita (Foreground)**: La interfaz gráfica de Antigravity permite al usuario seleccionar explícitamente un perfil de agente específico desde un menú desplegable al iniciar un chat. Esto convierte al agente seleccionado en el **Primary Agent**, lo que permite una interacción fluida y continua (ideal para entrevistas, recolección de requisitos, etc.).
*   **Background Orchestration**: Si el usuario habla con el agente genérico, este puede invocar subagentes en segundo plano (usando la tool `invoke_subagent`). El subagente corre en su propia ventana de contexto (aislada) y entrega el resultado al hilo principal, evitando contaminar el historial del usuario con logs o pasos intermedios.

### Claude Code
*   **Aislamiento y Subagentes**: Cuando el agente principal de Claude Code detecta que una tarea es mejor manejada por un subagente (basado en la descripción del YAML), le delega la tarea. El subagente se ejecuta de manera totalmente aislada y silenciosa (sin mostrar sus lecturas de archivos o razonamientos) y solo devuelve el output final a la conversación principal.
*   **Agent Teams (Trabajo en equipo)**: Claude permite flujos más dinámicos donde múltiples agentes pueden desafiar sus suposiciones mutuas, compartir descubrimientos a mitad de tarea o ejecutar flujos de trabajo dinámicos en paralelo.
*   **Invocación Explícita**: El usuario puede forzar a Claude a usar un subagente específico mencionándolo en el prompt.

## 3. Filosofía de "Ruido" y Contexto

Ambas herramientas coinciden en un principio fundamental de la "Agentic AI" moderna: **Proteger la ventana de contexto del usuario**.

Al delegar tareas complejas (como analizar cientos de archivos o perfilar datos) a subagentes, la información transitoria (lecturas de archivos fallidas, comandos que dan error, iteraciones de código intermedias) muere con el subagente. El usuario y el agente principal solo ven el resumen ejecutivo, reduciendo drásticamente el consumo de tokens y la contaminación cognitiva.

## Referencias Externas
*   [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
*   [Antigravity Customizations](./docs/agy-customizations.md)
