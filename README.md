# Amiga IA - Universal Declarative Skills & Agents

> Repo name inspo 🎶: [Amiga Mia - Los Prisioneros](https://www.youtube.com/watch?v=qPHaLk4-_Ew)

[![Antigravity](https://img.shields.io/badge/Antigravity-Gemini-8E24AA?style=flat&logo=googlegemini&logoColor=white)](#)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Anthropic-D97757?style=flat&logo=anthropic&logoColor=white)](#)
[![NPM](https://img.shields.io/badge/NPM-Package-CB3837?style=flat&logo=npm&logoColor=white)](#)

[English](#english) | [Español](#español)

---

<a name="english"></a>
## English

### 1. Project Description
**Amiga IA** is a centralized repository for storing *declarative skills*, *declarative agents*, and a *universal adapter* that are 100% cross-compatible with **Antigravity (Gemini)** and **Claude Code**. It provides a single source of truth for modern, modular AI capabilities formatted using the **Agent Skills (Markdown + Lazy Loading)** standard.

### 2. Repository Structure
```text
amiga-ia/
├── package.json             # NPM Package definition
├── agent/                   # Boilerplate Agent entrypoint (agent.js)
├── adapters/                # Universal adapter (universal_adapter.js)
├── agents/                  # Declarative Markdown agents
│   └── *.md                 # Individual agent definitions
├── docs/                    # Persistent agent memory and architecture docs
├── skills/                  # Declarative Markdown skills
│   └── */SKILL.md           # Individual skill definitions in directories
└── settings.json            # Additional configurations
```

### 3. Declarative Format

#### Skills
All skills are defined as declarative directories containing a `SKILL.md` file. The adapter scans these directories, extracts the YAML frontmatter, and provides the LLM with an XML index (`<available_skills>`). When the agent decides to use a skill, it reads the Markdown file natively to understand the instructions.
```yaml
---
name: code-review
description: Reviews the code for logic errors.
---
1. Read the files.
2. Run tests.
```

#### Agents
Agents are defined in `.md` files containing the persona and instructions.
```markdown
# commit-assistant
You are an agent designed to create commits.
Use the `code-review` skill if necessary.
```

### 4. Installation & Usage
You can install this repository as a Node.js package or consume it locally.

**As an NPM Package:**
```bash
npm install -g @anacatavc/amiga-ia
```

**Setup Wizard (CLI):**
Once installed globally, you can run the interactive setup wizard to automatically configure your assistant (Claude or Antigravity) with the package files:
```bash
amiga-ia-setup
```



### 5. Uninstallation
To completely remove the package and clean up your AI assistant folders:
1. Run `amiga-ia-setup` and select `u` (Uninstall) to safely delete the copied skills and agents.
2. Run `npm uninstall -g @anacatavc/amiga-ia` to remove the package.

### 6. Extending the Package
* **To add a new skill:** Create a new `skills/<name>/SKILL.md` directory and file with YAML frontmatter.
* **To add a new agent:** Create a new `agents/<name>.md` file.

---

<a name="español"></a>
## Español

### 1. Descripción del Proyecto
**Amiga IA** es un repositorio centralizado diseñado para almacenar *skills declarativas*, *agentes declarativos* y un *adaptador universal* que son 100% compatibles tanto con **Antigravity (Gemini)** como con **Claude Code**. Proporciona una única fuente de verdad para un ecosistema de IA estructurado bajo el estándar **Agent Skills (Markdown + Lazy Loading)**.

### 2. Estructura del Repositorio
```text
amiga-ia/
├── package.json             # Definición del paquete NPM
├── agent/                   # Entrypoint del agente (agent.js)
├── adapters/                # Adaptador universal (universal_adapter.js)
├── agents/                  # Agentes declarativos en Markdown
│   └── *.md                 # Definiciones individuales de agentes
├── docs/                    # Memoria persistente y documentación del proyecto
├── skills/                  # Skills declarativas en Markdown
│   └── */SKILL.md           # Definiciones individuales de skills
└── settings.json            # Configuraciones adicionales
```

### 3. Formato Declarativo

#### Skills
Todas las skills se definen como carpetas con un archivo `SKILL.md`. El adaptador lee el YAML frontmatter y le presenta a la IA un catálogo XML (`<available_skills>`). La IA usa *Lazy Loading* (carga diferida) para leer el archivo solo cuando necesita usar la habilidad.
```yaml
---
name: code-review
description: Reviews the code for logic errors.
---
1. Read the files.
2. Run tests.
```

#### Agentes
Los agentes se definen en archivos `.md`. Contienen el prompt principal del asistente.
```markdown
# commit-assistant
You are an expert git agent.
```

### 4. Instalación y Uso
Puedes instalar este repositorio como un paquete de Node.js o usarlo localmente.

**Como paquete NPM:**
```bash
npm install -g @anacatavc/amiga-ia
```

**Asistente de Configuración (CLI):**
Una vez instalado globalmente, puedes correr el asistente para copiar automáticamente las skills y agentes a tu entorno (Claude o Antigravity):
```bash
amiga-ia-setup
```



### 5. Desinstalación
Para eliminar completamente el paquete y limpiar las carpetas de tu asistente de IA:
1. Ejecuta `amiga-ia-setup` y selecciona `u` (Uninstall) para borrar de forma segura las skills y agentes copiados.
2. Ejecuta `npm uninstall -g @anacatavc/amiga-ia` para eliminar el paquete.

### 6. Extendiendo el Paquete
* **Para añadir una nueva skill:** Crea una carpeta y archivo `skills/<nombre>/SKILL.md` con metadata en YAML.
* **Para añadir un nuevo agente:** Crea un archivo `agents/<nombre>.md`.
