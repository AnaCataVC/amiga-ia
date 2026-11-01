# Guía de Uso e Instalación de la CLI de Amiga IA (`ami`)

[English](cli-installation-guide.md) | [Español](cli-installation-guide.es.md)

`ami` (también ejecutable mediante el alias retrocompatible `amiga-ia-setup`) es la interfaz de línea de comandos oficial de **Amiga IA (`@anacatavc/amiga-ia`)**. Gestiona la instalación, diagnóstico, paquetes de dominio (Domain Packs), recibos y extensiones de runtime para **Anthropic Claude Code**, **Google Antigravity** y **OpenAI Codex**.

---

## 1. Instalación

Instala `@anacatavc/amiga-ia` de forma global mediante el registro de NPM:

```bash
npm install -g @anacatavc/amiga-ia
```

Verifica la instalación:

```bash
ami --version       # o: node bin/setup.js
ami list            # muestra el catálogo del ecosistema y el estado local de asistentes
```

> [!NOTE]
> `ami` y `amiga-ia-setup` apuntan exactamente al mismo ejecutable. Puedes utilizar el que mejor se adapte a tu flujo de trabajo.

---

## 2. Referencia de Comandos

| Comando | Alias | Descripción |
| :--- | :--- | :--- |
| `ami` | `amiga-ia-setup` | Abre el menú interactivo del asistente de configuración. |
| `ami install` | - | Asistente interactivo para seleccionar asistentes y paquetes de dominio. |
| `ami list` | `ami ls` | Lista todos los Domain Packs (`essential`, `data`, `ui`), extensiones, capacidades y asistentes configurados. |
| `ami add <target>` | - | Activa un Domain Pack (`data`, `ui`) o instala una Runtime Extension externa (`claude-mods`). |
| `ami remove <target>`| `ami rm <target>`| Desactiva un Domain Pack opcional (`data`, `ui`) o remueve una Runtime Extension (`claude-mods`). |
| `ami doctor` | `ami --doctor` | Audita la salud del sistema, manifiestos de versión, integridad de YAML frontmatter, hooks, reglas y extensiones. |
| `ami uninstall` | `ami u` | Elimina limpiamente las capacidades, reglas y hooks de Amiga IA de todos los asistentes. |

---

## 3. Domain Packs y Extensiones de Runtime

Amiga IA organiza sus **39 capacidades** (14 subagentes y 25 skills declarativas) y extensiones de plataforma en paquetes lógicos definidos en `registry/packs.json`:

```text
Ecosistema AMIGA IA
│
├── Domain Packs Integrados (Skills y Agentes Declarativos y Portables en Markdown)
│   ├── essential   (Núcleo base: 12 agentes, 20 skills — obligatorio)
│   ├── data        (Analítica y SQL: ami-data-scientist, ami-optimize-sql, ami-build-dashboard)
│   └── ui          (UI/UX: ami-ui-builder, ami-design-ux, ami-prototype-ui, ami-audit-ui-consistency)
│
└── Runtime Extensions (Plugins Específicos de Plataforma)
    └── claude-mods (6 mods en TypeScript/ESM para la CLI de Claude Code)
```

### Gestión de Domain Packs (`ami add` / `ami remove`)

Los Domain Packs vienen empaquetados directamente dentro de `@anacatavc/amiga-ia`. Su activación o desactivación es **instantánea, 100% offline y no requiere descargas de red**:

```bash
# Activar el paquete de Datos y Analítica en los asistentes instalados:
ami add data

# Activar el paquete de Ingeniería UI y UX:
ami add ui

# Desactivar un paquete opcional:
ami remove data
```

> [!IMPORTANT]
> El paquete `essential` contiene las capacidades base de ingeniería de software, pruebas, higiene de git y Cleanroom TDD. No puede desactivarse individualmente; utiliza `ami uninstall` para remover Amiga IA por completo.

### Gestión de Extensiones de Runtime para Claude Code (`ami add claude-mods`)

`claude-mods` conecta Amiga IA con **`AnaCataVC/ami-claude-mods`**, instalando 6 mods en `~/.claude/mods/`:
* `hooks-viewer`: Panel lateral para inspeccionar hooks cargados y plugins activos.
* `undelegated-reads`: Disyuntor que promueve la delegación de búsquedas mecánicas a subagentes.
* `close-checklist`: Inspector de seguridad previo al cierre que verifica cambios en git y contenedores activos.
* `child-sessions`: Bandeja de mensajes interactiva de subagentes sobre el prompt.
* `cleanroom-guard`: Aislamiento a nivel de host para Cleanroom TDD de doble ciego.
* `context-guard`: Alineación de perfiles de GitHub CLI y clústeres de Kubernetes según el espacio de trabajo.

```bash
# Instalar los 6 mods en ~/.claude/mods/:
ami add claude-mods

# Desinstalar los mods de ~/.claude/mods/:
ami remove claude-mods
```

---

## 4. Diagnóstico e Integridad (`ami doctor`)

Ejecuta `ami doctor` para verificar la configuración en cualquier momento:

```bash
ami doctor
```

El diagnóstico audita de forma exhaustiva:
1. **Paridad de Versiones:** Comprueba que los entornos locales coincidan con la versión del paquete CLI ejecutado.
2. **Actualizaciones en NPM:** Verifica si existe una versión más reciente publicada en el registro de NPM.
3. **Integridad del Plugin (Antigravity):** Confirma la estructura de manifiestos, assets e iconos en `~/.gemini/config/plugins/amiga-ia`.
4. **Validación de YAML Frontmatter:** Inspecciona las 25 skills y 14 subagentes verificando esquemas (`name:`, `description:`, `allowed-tools:`, permisos de escritura y delegación).
5. **Sintaxis y Compatibilidad de Hooks:** Valida `settings.json` y `hooks.json`, alertando si hay scripts de bash en Windows o powershell en Linux.
6. **Integración de Reglas:** Revisa los bloques delimitados en `CLAUDE.md`, `AGENTS.md` y `rules/ami-rules.md`.
7. **Extensiones de Runtime (Claude Code):** Inspecciona los mods instalados en `~/.claude/mods/`.

---

## 5. Desinstalación

Para retirar limpiamente Amiga IA de tu estación de trabajo:

```bash
# 1. Eliminar habilidades, subagentes, reglas y hooks fusionados:
ami uninstall

# 2. Desinstalar el paquete global:
npm uninstall -g @anacatavc/amiga-ia
```
