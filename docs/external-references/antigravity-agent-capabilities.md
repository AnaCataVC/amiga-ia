> **Created:** 2026-08-11
> **Last Updated:** 2026-08-11

# Antigravity Agent Capabilities vs Perceived Limitations

Este documento sintetiza la investigación sobre las capacidades de los agentes dentro de Google Antigravity, específicamente abordando la duda sobre si un agente puede escribir código e invocar a otros agentes dentro de la misma sesión.

## 1. Mitos y Percepciones Erróneas
Existe la percepción de que en Antigravity un agente no puede escribir código ni orquestar a otros agentes en la misma sesión. Esta es una **percepción incorrecta**.

## 2. Capacidades Reales en Antigravity
Según la documentación oficial de Antigravity (tanto para el IDE como para la aplicación Antigravity 2.0):

*   **Generación y Edición de Código:** Los agentes en Antigravity (en "Agent Mode") tienen acceso total a herramientas de modificación de sistema de archivos (`write_to_file`, `replace_file_content`, `multi_replace_file_content`). Pueden leer, escribir y refactorizar código directamente en el repositorio local.
*   **Orquestación en Segundo Plano (Subagentes):** Antigravity soporta la invocación dinámica de múltiples agentes dentro de la misma sesión. El agente principal puede utilizar la herramienta `invoke_subagent` para lanzar subagentes paralelos o secuenciales. Los subagentes corren en ventanas de contexto aisladas, ejecutan sus tareas (como perfilar bases de datos, revisar código, o investigar la web) y devuelven el resultado al agente principal, sin perder el hilo de la conversación original del usuario.

## 3. ¿Por qué el `ami-tech-lead` parecía limitado?
Si el `ami-tech-lead` no estaba editando código, no se debe a una limitante de Antigravity, sino al **Diseño de Rol** que le configuramos. 

En su archivo `agents/ami-tech-lead.md`, definimos explícitamente:
```yaml
allowed-tools: Bash, Read, Grep, WebSearch, search_web, invoke_subagent, write_to_file
```
Intencionalmente diseñamos a este agente como un "Despachador Maestro" (Master Dispatcher). Le quitamos las herramientas de edición de código duro (`replace_file_content`, etc.) para obligarlo a pensar a nivel macro y delegar la codificación a subagentes más especializados (o para que solo cree planes usando `write_to_file`). 

Si deseamos que el `ami-tech-lead` también pueda programar y refactorizar archivos directamente sin delegarlo, simplemente debemos agregar las herramientas de edición de código a su YAML Frontmatter.

## Referencias
*   [Antigravity IDE Docs](https://antigravity.google/docs/ide)
*   [Antigravity 2.0 Docs](https://antigravity.google/docs/app)
*   [Agent Permissions & Tools](https://antigravity.google/docs/permissions)
