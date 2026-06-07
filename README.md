# Amiga IA - Universal Skills & Agents

[![Antigravity](https://img.shields.io/badge/Antigravity-Gemini-8E24AA?style=flat&logo=googlegemini&logoColor=white)](#)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Anthropic-D97757?style=flat&logo=anthropic&logoColor=white)](#)

[English](#english) | [Español](#español)

---

<a name="english"></a>
## English

### 1. Project Description
**Amiga IA** is a centralized repository for storing *skills*, *agent* definitions, and lifecycle *hooks* that are 100% cross-compatible with **Antigravity (Gemini)** and **Claude Code**. It provides a single source of truth for modern, modular AI capabilities.

### 2. Repository Structure
```text
amiga-ia/
├── agents/                  # Agent definitions and system prompts (e.g., tech-lead.md)
├── docs/                    # Persistent agent memory and architecture docs
├── skills/                  # Shared skills (YAML frontmatter + Markdown)
└── settings.json            # Additional configurations (e.g., Claude Hooks)
```

### 3. Installation & Usage
To maintain a single centralized repository, create symbolic links (symlinks) from this repository to your AI assistants' configuration folders. Replace `/path/to/amiga-ia` or `C:\path\to\amiga-ia` with your actual repository path.

**For Claude Code (Mac/Linux):**
```bash
ln -s /path/to/amiga-ia/skills ~/.claude/skills
ln -s /path/to/amiga-ia/agents ~/.claude/agents
ln -s /path/to/amiga-ia/settings.json ~/.claude/settings.json
```

**For Claude Code (Windows):**
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills" -Target "C:\path\to\amiga-ia\skills"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\agents" -Target "C:\path\to\amiga-ia\agents"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\settings.json" -Target "C:\path\to\amiga-ia\settings.json"
```

**For Antigravity / Gemini (Mac/Linux):**
```bash
ln -s /path/to/amiga-ia/skills ~/.gemini/config/skills
```

**For Antigravity / Gemini (Windows):**
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills" -Target "C:\path\to\amiga-ia\skills"
```

### 4. Architecture Philosophy (Why this works for both)
While this structure perfectly mimics Claude Code's official static hierarchy, it serves as a powerful dynamic engine for **Antigravity**:
* **`skills/`**: Antigravity natively parses YAML Frontmatter. It uses these files as programmable workflows.
* **`agents/`**: While Claude loads agents statically, Antigravity uses these Markdown files dynamically. It reads them and uses tools like `define_subagent` to spawn autonomous "clones" with these exact personas.
* **`docs/`**: Serves as Antigravity's long-term memory to prevent context loss across sessions.
* **`settings.json`**: Used exclusively by Claude for hooks. Antigravity ignores this and relies on its explicit **Planning Mode** (Investigate -> Plan -> Approve -> Execute) for security.

---

<a name="español"></a>
## Español

### 1. Descripción del Proyecto
**Amiga IA** es un repositorio centralizado diseñado para almacenar *skills*, definiciones de *agentes* y *hooks* que son 100% compatibles tanto con **Antigravity (Gemini)** como con **Claude Code**. Proporciona una única fuente de verdad para un ecosistema de IA moderno.

### 2. Estructura del Repositorio
```text
amiga-ia/
├── agents/                  # Definiciones de agentes y prompts (ej. tech-lead.md)
├── docs/                    # Memoria persistente y documentación del proyecto
├── skills/                  # Habilidades compartidas (yaml frontmatter + markdown)
└── settings.json            # Configuraciones adicionales (ej. Hooks de Claude)
```

### 3. Instalación y Uso
Crea enlaces simbólicos (symlinks) desde este repositorio hacia las carpetas de configuración de tus asistentes. Reemplaza `/ruta/a/amiga-ia` o `C:\ruta\a\amiga-ia` por la ruta absoluta donde clonaste este repositorio.

**Para Claude Code (Mac/Linux):**
```bash
ln -s /ruta/a/amiga-ia/skills ~/.claude/skills
ln -s /ruta/a/amiga-ia/agents ~/.claude/agents
ln -s /ruta/a/amiga-ia/settings.json ~/.claude/settings.json
```

**Para Claude Code (Windows):**
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills" -Target "C:\ruta\a\amiga-ia\skills"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\agents" -Target "C:\ruta\a\amiga-ia\agents"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\settings.json" -Target "C:\ruta\a\amiga-ia\settings.json"
```

**Para Antigravity / Gemini (Mac/Linux):**
```bash
ln -s /ruta/a/amiga-ia/skills ~/.gemini/config/skills
```

**Para Antigravity / Gemini (Windows):**
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills" -Target "C:\ruta\a\amiga-ia\skills"
```

### 4. Filosofía de Arquitectura (Por qué funciona para ambos)
Aunque esta estructura imita a la perfección la jerarquía estática oficial de Claude Code, funciona como un motor dinámico súper potente para **Antigravity**:
* **`skills/`**: Antigravity lee nativamente el YAML Frontmatter y usa estos archivos como flujos de trabajo programables.
* **`agents/`**: Mientras Claude carga los agentes de forma estática, Antigravity usa estos archivos de forma dinámica. Los Los lee en tiempo real para crear "clones" subagentes usando herramientas como `define_subagent`.
* **`docs/`**: Actúa como la memoria a largo plazo de Antigravity, previniendo la pérdida de contexto entre diferentes sesiones de chat.
* **`settings.json`**: Usado exclusivamente por Claude para sus hooks. Antigravity ignora este archivo y basa su seguridad en su **Modo de Planificación** explícito (Investigar -> Planear -> Aprobar -> Ejecutar).
