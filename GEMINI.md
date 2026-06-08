# Instrucciones para Antigravity (Gemini)

Este archivo sirve como referencia de contexto para Antigravity (Gemini) al momento de operar en este repositorio.

## 🚨 Reglas de Desarrollo Obligatorias
1. **Idioma del Código:** Todo el código fuente DEBE escribirse siempre en **Inglés**.
2. **Historial de Git:** Todos los mensajes de commit DEBEN escribirse en **Inglés** y seguir el estándar de **Conventional Commits** (usar prefijos como `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.).
3. **Namespacing (Prefijo `ami-`):** Cualquier nueva skill o agente que se cree DEBE llevar el prefijo `ami-` en su nombre de carpeta, archivo y en la metadata interna (`name:`). Esto evita colisiones con ecosistemas externos y mantiene la suite unificada.

## Arquitectura de Entorno IA Declarativo (Agent Skills)
Este repositorio ha evolucionado hacia un ecosistema de **Skills y Agentes en Markdown con Lazy Loading XML**, siguiendo el estándar de Agent Skills. Esto garantiza portabilidad universal y eficiencia extrema de tokens para Antigravity y Claude.

* **`agents/`**: Definiciones de los subagentes en archivos `.md`. Describen el comportamiento y herramientas necesarias en texto natural.
* **`skills/`**: Habilidades o flujos de trabajo en carpetas con un archivo `SKILL.md`. Utilizan YAML Frontmatter para la metadata y el cuerpo para instrucciones imperativas detalladas.
* **`docs/`**: Memoria a largo plazo del agente. Decisiones Arquitectónicas (ADRs), contexto y restricciones del proyecto persistidos entre sesiones.
* **`adapters/`**: El adaptador universal (`universal_adapter.js`) que escanea los directorios dinámicamente y genera un índice XML (`<available_skills>`) para el System Prompt de la IA, permitiendo "Lazy Loading" de los archivos Markdown cuando se necesiten.

## Flujo de Trabajo y CLI (Antigravity)
1. **Lectura Dinámica (Lazy Loading):** Antigravity y el adaptador escanean dinámicamente `skills/` y `agents/` extrayendo el frontmatter para presentarle a la IA un catálogo de herramientas.
2. **Instalador Interactivo (Wizard):** El proyecto cuenta con un CLI ejecutable (`amiga-ia-setup`) en `bin/setup.js`. Este script hace un copy-paste físico de los archivos hacia las carpetas `~/.gemini/config/` y `~/.claude/` para evitar problemas de permisos de Windows con symlinks.
3. **Ejecución Nativa:** La IA lee el índice XML y utiliza su propia herramienta de lectura de archivos (`view_file`) para abrir y procesar el `SKILL.md` únicamente cuando decide que lo necesita.

## Seguridad Integrada (Planning Mode)
Antigravity ignora los hooks de bash cuando está en modo seguro. Su seguridad radica en su pipeline atómico: investigar, redactar un plan (`implementation_plan.md`), requerir aprobación humana, ejecutar usando `task.md`, y documentar con `walkthrough.md`.

## Resumen de la Jerarquía Estricta
El repositorio se distribuye como un paquete NPM:

```text
/
├── package.json                 ← Registro del paquete y comando global (amiga-ia-setup)
├── bin/setup.js                 ← Instalador interactivo (CLI wizard copy-paste)
├── adapters/                    ← Universal Adapter para compilar el catálogo XML
├── agent/                       ← Entrypoint principal que exporta librerías
├── skills/*/SKILL.md            ← Directorios de habilidades con YAML y Markdown detallado
├── agents/*.md                  ← Perfiles de subagentes en Markdown
└── settings.json                ← Hooks heredados o configuraciones extra
```
