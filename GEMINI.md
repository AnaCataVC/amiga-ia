# Instrucciones para Antigravity (Gemini)

Este archivo sirve como referencia de contexto para Antigravity (Gemini) al momento de operar en este repositorio.

## 🚨 Reglas de Desarrollo Obligatorias
1. **Idioma del Código:** Todo el código fuente DEBE escribirse siempre en **Inglés**.
2. **Historial de Git:** Todos los mensajes de commit DEBEN escribirse en **Inglés** y seguir el estándar de **Conventional Commits** (usar prefijos como `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.).

## Arquitectura de Entorno IA Avanzado (Enterprise-grade)
Este repositorio está estructurado basándose en las últimas arquitecturas de IA y las mejores prácticas oficiales:

* **`agents/`**: Definiciones de `instructions` y `system_prompt` para subagentes especializados (Ej. `commit-assistant.md`). Contienen Procedimientos Operativos Estándar (SOPs) y reglas estrictas.
* **`skills/`**: Habilidades, comandos manuales (slash commands) y flujos de trabajo. Siguen el formato `nombre/SKILL.md` (con Frontmatter YAML). Las skills pueden ser invocadas manualmente por el usuario o de forma autónoma por la IA.
* **`docs/`**: Memoria a largo plazo del agente. Decisiones Arquitectónicas (ADRs), contexto y restricciones del proyecto persistidos entre sesiones.

## Sistema de Agentes (`agents/*.md`)
Los agentes se definen mediante archivos Markdown con **Frontmatter YAML**.
* **Estructura Requerida:** 
  ```yaml
  ---
  name: nombre-agente
  description: Breve descripción de lo que hace.
  tools: Read, Grep, Bash # (Opcional) Limita el acceso a herramientas
  ---
  ```
  El cuerpo del Markdown sirve como el System Prompt.
* **Comportamiento (Antigravity vs Claude):** 
  Claude carga esto estáticamente y lo invocas vía `/agents`. Antigravity lo lee dinámicamente y lo usa como `system_prompt` al ejecutar `define_subagent`.

## Skills Compartidas (`skills/*/SKILL.md`)
Las habilidades son carpetas modulares que pueden contener dependencias.
* **Estructura Mínima:**
  ```text
  skills/
  └── mi-skill/
      ├── SKILL.md          (Obligatorio: YAML Frontmatter + Markdown)
      ├── scripts/          (Opcional: Código ejecutable)
      ├── references/       (Opcional: Documentación adicional)
      └── assets/           (Opcional: Plantillas, íconos)
  ```
* **Frontmatter Recomendado:** `name`, `description`, `allowed-tools`.

## Hooks y Configuración (`settings.json`)
Los hooks de Claude se definen en `settings.json` o `settings.local.json`.
* Utilizan `matcher` para filtrar herramientas (ej. `"Bash"`, `"Edit|Write"`).
* Usan la variable `${CLAUDE_PROJECT_DIR}` para enrutar scripts locales de forma segura.
* Un `exit 2` bloquea la acción, mientras que un `exit 1` es un error no bloqueante.

## El Superpoder de Antigravity (Por qué usamos esta estructura)
Aunque el formato es idéntico al de Claude Code, esta arquitectura potencia a Antigravity de formas únicas:
1. **Skills como Motor Nativo:** Antigravity mapea internamente la carpeta `skills/`. Lee el YAML Frontmatter y el Markdown para asimilar flujos de trabajo de forma nativa.
2. **Subagentes Dinámicos (`agents/`):** A diferencia de Claude (que carga agentes estáticamente), Antigravity usa `view_file` para leer `agents/*.md` bajo demanda, extrayendo el contenido para pasarlo como `system_prompt` a sus herramientas `define_subagent` e `invoke_subagent`. Esto le permite generar enjambres especializados en tiempo real.
3. **Memoria a Largo Plazo (`docs/`):** Al no tener contexto persistente entre sesiones, Antigravity usa la carpeta `docs/` como fuente de la verdad para recordar Decisiones Arquitectónicas (ADRs) antes de planificar.
4. **Seguridad Integrada (Planning Mode):** Antigravity ignora los hooks de `settings.json`. Su seguridad radica en su pipeline atómico: investigar, redactar un plan, requerir aprobación humana, y ejecutar.

## Resumen de la Jerarquía Estricta
Para mantener la compatibilidad, el repositorio emula exactamente el estándar de Claude:

```text
/
├── skills/<nombre>/SKILL.md     ← skills (habilidades compartidas y flujos)
├── agents/<nombre>.md           ← subagentes (prompts especializados)
├── settings.json                ← hooks (compartido y versionado)
└── settings.local.json          ← hooks (local, no versionado en git)
```
