# Amiga IA - Autonomous Agentic Suite & Declarative Skills

<p align="center">
  <img src="./favicon.png" alt="Amiga IA Logo" width="120" />
</p>

> 🎶 Repo name inspo: [Amiga Mia - Los Prisioneros](https://www.youtube.com/watch?v=qPHaLk4-_Ew)

> 🤖 Product website: [amiga-ia.ana-catalina.com/](https://amiga-ia.ana-catalina.com/)

---

[![Antigravity](https://img.shields.io/badge/Antigravity-Gemini-8E24AA?style=flat&logo=googlegemini&logoColor=white)](#)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Anthropic-D97757?style=flat&logo=anthropic&logoColor=white)](#)
[![NPM](https://img.shields.io/badge/NPM-Package-CB3837?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com/package/@anacatavc/amiga-ia)

---

[English](#english) | [Español](#español)

---

<a name="english"></a>
## English

### 1. Project Description
**Amiga IA** is a comprehensive ecosystem of *autonomous subagents*, *stateless guardrail hooks*, and *portable declarative skills* designed to elevate AI coding assistants from passive command executors into proactive team collaborators. Engineered specifically for **Antigravity (Gemini)** and **Claude Code**, Amiga IA provides a single source of truth for scalable AI capability management built on the **Agent Skills (Markdown + Lazy Loading)** standard. 

With **v3.0.0 ("The Agentic Evolution")**, Amiga IA introduces decentralized multi-skill orchestration, enabling specialized subagents to autonomously discover repository tools and conduct parallel code reviews, repository health audits, and automated documentation without requiring step-by-step human guidance.

### 2. Technologies & Architectural Innovations
* **Agent Skills (XML + Markdown Lazy Loading):** A token-efficient architecture where an index of available tools is compiled into the system prompt, allowing AI models to open and consume imperative skill instructions only when actively required.
* **Multi-Skill Parallel Orchestration (ADR-002):** Decentralized subagent profiles (such as `ami-pr-reviewer`, `ami-doc-architect`, and `ami-repo-auditor`) coordinate parallel worker threads to scan codebase technical debt, verify pre-push consistency, and review code concurrently.
* **Zero-Overhead Stateless Execution (ADR-003):** Background security hooks are optimized for token economy and zero memory pollution, operating seamlessly across native Bash, Windows PowerShell, and zero-dependency Node.js execution engines.
* **Compact System Prompt & Unified Hook Optimization (ADR-004):** Refactored Universal Adapter XML generation to use root-relative compact attributes and migrated inline PowerShell and Bash commands to external runtime scripts (`hooks/scripts/ami-hooks.ps1` & `ami-hooks.sh`). This achieved a verified **36.3% reduction (-1,211 tokens/turn)** in recurring System Prompt overhead (dropping from 3,335 to 2,124 tokens/turn), faster LLM inference, and zero hook deduplication errors.
* **Interactive CLI Wizard (`amiga-ia-setup`):** An automated setup, migration, and diagnostic suite built in Node.js that cleanly installs skills, merges configurations into AI user settings, and dynamically checks system health.

### 3. Key Learnings (Developer Takeaways)
Building and scaling Amiga IA through its evolution into a fully agentic ecosystem yielded significant engineering lessons:
* **Agentic vs. Passive Prompting:** Traditional step-by-step imperative scripts break down as codebases scale. Transitioning to autonomous subagent profiles that reason about project goals, discover local tools, and delegate worker threads in parallel proved dramatically more robust and scalable than monolithic prompt engineering.
* **Token Economy & Statelessness:** Early iterations utilized persistent background caching to store local session summaries. Iterative analysis revealed that retaining stale context across session restarts degraded LLM inference speed and inflated token consumption. Depreciating session state caching in favor of stateless, on-demand reactive inspections (ADR-003) drastically boosted system responsiveness and precision.
* **Mitigating the Silent Recurring Token Tax:** Dynamic tool catalogs injected into AI System Prompts impose a severe compounding cost over extended conversational sessions. Utilizing attribute-driven root-relative indexing instead of verbose XML wrapper hierarchies eradicated massive static redundancy (ADR-004). Furthermore, transitioning from complex inline shell expressions to standardized external runtime invocations prevented OS shell escaping gotchas and eliminated string-matching deduplication failures across platforms.
* **Cross-Platform & Multi-Engine Unification:** Achieving 100% cross-compatibility between disparate AI runtimes (Anthropic's Claude Code and Google's Antigravity) and distinct operating systems (Linux/macOS Bash vs. Windows PowerShell) required abstracting hook logic into universal runtime scripts and enforcing strict XML capability indexing.

### 4. Repository Structure
```text
amiga-ia/
├── package.json             # NPM Package registry definition & Single Source of Truth
├── agent/                   # Boilerplate Agent entrypoint (agent.js)
├── adapters/                # Universal XML catalog compiler (universal_adapter.js)
├── agents/                  # Autonomous Subagent profiles in Markdown (ami-*.md)
├── docs/                    # Persistent agent memory & documentation tree
│   ├── adr/                 # Architectural Decision Records (ADRs)
│   ├── architecture/        # Deep structural & adapter engineering guides
│   └── learning/            # Captured session learnings and iterative patterns
├── skills/                  # Declarative Markdown skills (ami-*/SKILL.md)
├── hooks/                   # Claude Code native and cross-platform guardrail hooks
│   ├── hooks.json           # Plugin auto-discovery configuration
│   └── scripts/             # External runtime hooks (.js wrappers, ami-hooks.ps1, & ami-hooks.sh)
├── hooks.json               # Claude Code native hooks configuration (Bash engine)
└── hooks-pwsh.json          # Claude Code native hooks configuration (PowerShell engine)
```

### 5. Included Skills & Agents

All built-in capabilities strictly utilize the **`ami-`** namespace prefix to prevent collisions with external AI ecosystems.

| Type | Name | Description |
|---|---|---|
| Agent | **ami-data-scientist** | Master orchestrator agent for Data & SQL. Coordinates exploratory dataset profiling, database query optimizations, and executive dashboards. |
| Agent | **ami-doc-architect** | Master documentation orchestrator that coordinates doc-manager, context research, and session learnings extraction in parallel. |
| Agent | **ami-expert-council** | Spawns a council of specialized subagents tailored to discuss, debate, and refine a user's architectural idea from multiple perspectives. |
| Agent | **ami-next-step-assistant** | Acts as an automated project guide by evaluating repository health and recommending the most critical next action. |
| Agent | **ami-pr-publisher** | Master orchestrator agent that performs a comprehensive review, summary drafting, and conflict audit on Pull Requests before publishing. |
| Agent | **ami-pr-reviewer** | Master orchestrator agent that evaluates existing Pull Requests using parallel worker subagents and automated capability discovery. |
| Agent | **ami-push-assistant** | Pre-push orchestrator that conducts baseline quality, security leak scans, and data consistency checks before pushing code. |
| Agent | **ami-release-manager** | Central orchestrator agent that automates version tag calculation, bilingual semantic changelog drafting, and GitHub release publication. |
| Agent | **ami-repo-auditor** | Master audit orchestrator that evaluates codebase technical debt, dependency hygiene, and security across modules concurrently. |
| Skill | **ami-plan-commits** | Analyzes the working tree, performs security/leak audits, plans Conventional Commits/amend/squash, and executes staged git actions. |
| Skill | **ami-research-context** | Actively researches up-to-date external documentation and persists findings in references to prevent context degradation. |
| Skill | **ami-build-dashboard** | Builds interactive web dashboards and publication-quality Python visualizations from analytical datasets and KPIs. |
| Skill | **ami-profile-data** | Performs exploratory data analysis (EDA), quantifies null distributions, detects outliers, and audits methodological validity. |
| Skill | **ami-validate-data** | Validates structural consistency between source code changes and data layer definitions (schemas, queries). |
| Skill | **ami-analyze-dependencies** | Audits project library health, detecting unused, outdated, vulnerable, or phantom dependencies. |
| Skill | **ami-manage-docs** | Comprehensive documentation manager. Detects whether to architect new docs from scratch or synchronize existing wikis with code diffs. |
| Skill | **ami-extract-learnings** | Inspects recent codebase edits to extract architectural decisions, lessons, antipatterns, and surprises into persistent memory. |
| Skill | **ami-debug-issue** | Performs an evidence-based debugging procedure, isolating root causes without guesswork and writing regression tests. |
| Skill | **ami-analyze-pr-comments** | Analyzes code review observations left by teammates on active PRs, organizing action items and formulating accurate replies. |
| Skill | **ami-detect-pr-conflicts** | Auto-triggered prior to PR publishing or review. Detects overlapping commit histories and potential merge conflicts across active branches. |
| Skill | **ami-review-peer-pr** | Assists in conducting code reviews on teammates' Pull Requests, producing categorized architectural and logic observations. |
| Skill | **ami-review-self-pr** | Operates as a stringent Senior Engineer reviewing your own work-in-progress code, identifying bugs and proactively applying local code fixes. |
| Skill | **ami-project-architect** | Interactively scaffolds project architectures, technology stacks, directory hierarchies, and bilingual starter documentation. |
| Skill | **ami-audit-quality** | Conducts deep inspections on modified code for maintainability, modular design best practices, security flaws, and structural soundness. |
| Skill | **ami-draft-release** | Auto-triggered prior to publishing releases. Parses commit histories to draft structured bilingual release notes grouped by semantic type. |
| Skill | **ami-tag-release** | Auto-triggered before release bumps. Evaluates git histories against semantic versioning laws to compute precise stable or QA tags. |
| Skill | **ami-optimize-sql** | Writes and refactors SQL across major database dialects, eliminates query anti-patterns, and recommends high-impact indexes. |
| Skill | **ami-scan-tech-debt** | Scans repositories for technical debt, obsolete imports, duplicated logic, dead code, and pending comments (TODOs/FIXMEs). |
| Skill | **ami-create-tests** | Auto-triggered when new features lack automated test coverage. Crafts focused unit and regression tests tailored to modified code. |
| Skill | **ami-design-test-strategy** | Designed to run before writing tests. Formulates QA test strategies, pyramid distributions, mocking boundaries, and CI quality gates. |

### 6. Installation & Usage
The official and recommended setup method is installing Amiga IA globally via the NPM package registry:

```bash
npm install -g @anacatavc/amiga-ia
```

**Interactive Setup Wizard (CLI):**
Launch the setup wizard to configure your preferred AI coding assistants (Claude Code, Antigravity, or Both) and select your target shell runtime (Bash, native Windows PowerShell, or universal zero-dependency Node.js scripts):
```bash
amiga-ia-setup
```

**System Diagnostic & Health Tool (`doctor`):**
To verify global installation integrity, check for OS shell incompatibilities, validate YAML frontmatter schemas, and receive automated cleanup advisories for deprecated legacy folders:
```bash
amiga-ia-setup doctor
```

> 💡 **Background Hooks & Engine Selection:** Claude Code supports automated pre-commit advisory reminders and security interdictions. The interactive setup wizard cleanly merges these non-blocking guardrails into `~/.claude/settings.json` while generating an automated rollback backup at `~/.claude/settings.json.amiga-backup`. Google Antigravity natively executes its atomic planning pipeline and enforces declarative guardrails via `rules/ami-rules.md`.

#### 6.1 Global Directories Configured
When running `amiga-ia-setup`, the CLI wizard populates your home directory with clean, isolated capability configurations:

```text
~/.claude/                          # Claude Code Global Configuration
├── skills/ami-*/SKILL.md           # Declarative Skills (17 directories)
├── agents/ami-*.md                 # Autonomous Subagents (8 profiles)
├── settings.json                   # Merged Hooks (PreToolUse, PostToolUse)
└── settings.json.amiga-backup      # Safe original settings backup

~/.gemini/config/                   # Antigravity (Gemini) Global Configuration
├── skills/ami-*/SKILL.md           # Declarative Skills (17 directories)
├── agents/ami-*.md                 # Autonomous Subagents (8 profiles)
└── rules/ami-rules.md              # Declarative Operational Rules
```

### 7. Uninstallation
To cleanly detach Amiga IA from your AI coding environments:
1. Run `amiga-ia-setup` and select option `u` (Uninstall) to cleanly remove all copied skills, agents, rules, and hook injections from your settings.
2. Run `npm uninstall -g @anacatavc/amiga-ia` to purge the CLI package from your system.

### 8. Extending the Ecosystem
* **Mandatory Naming Convention (`ami-` prefix):** All custom skills and agent profiles MUST begin with `ami-` (e.g., `ami-db-migrator`). This ensures clean namespace separation and protects your custom tools from external conflicts.
* **Adding a New Skill:** Create a folder at `skills/ami-<name>/` containing a `SKILL.md` instruction file configured with standard YAML frontmatter.
* **Adding a New Agent:** Create an autonomous persona file at `agents/ami-<name>.md` detailing behavior rules, skill invocation authorizations, and coordination directives.

---

<a name="español"></a>
## Español

### 1. Descripción del Proyecto
**Amiga IA** es un ecosistema integral de *subagentes autónomos*, *hooks de seguridad sin estado* y *skills declarativas portátiles* diseñado para transformar a los asistentes de código por inteligencia artificial de simples ejecutores pasivos a colaboradores proactivos. Desarrollado nativamente para **Antigravity (Gemini)** y **Claude Code**, Amiga IA ofrece una única fuente de verdad para la gestión escalable de capacidades bajo el estándar de **Agent Skills (Markdown + Carga Diferida / Lazy Loading)**.

Con la versión **v3.0.0 ("The Agentic Evolution")**, Amiga IA introduce la orquestación multi-habilidad descentralizada, permitiendo que subagentes especializados descubran herramientas locales y ejecuten revisiones en paralelo de código, auditorías de salud y autodiagnósticos arquitectónicos sin depender de supervisión humana constante ni instrucciones paso a paso.

### 2. Tecnologías e Innovaciones Arquitectónicas
* **Agent Skills (XML + Carga Diferida / Lazy Loading):** Arquitectura optimizada para el ahorro de tokens donde un índice con el catálogo de herramientas se inyecta en el prompt base, permitiendo al LLM abrir y leer el archivo Markdown de instrucciones solo cuando necesita usar una habilidad específica.
* **Orquestación Multi-Habilidad en Paralelo (ADR-002):** Perfiles de subagente descentralizados (como `ami-pr-reviewer`, `ami-doc-architect` y `ami-repo-auditor`) coordinan flujos de trabajo concurrentes para inspeccionar deuda técnica, validar coherencia antes de un push y revisar PRs en simultáneo.
* **Ejecución Ligera Sin Estado (Zero-Overhead, ADR-003):** Los hooks en segundo plano están optimizados para la economía de tokens y cero contaminación del contexto de memoria, ejecutándose con fluidez mediante Bash, PowerShell nativo de Windows o scripts de Node.js sin dependencias externas.
* **Optimización del Prompt del Sistema y Hooks Unificados (ADR-004):** Refactorización del adaptador universal hacia atributos XML compactos con ruta raíz relativa, y migración de comandos en línea de PowerShell y Bash a scripts externos de tiempo de ejecución (`hooks/scripts/ami-hooks.ps1` y `ami-hooks.sh`). Esto logró una reducción verificada del **36.3% (-1,211 tokens por turno)** en la sobrecarga recurrente del Prompt del Sistema (cayendo de 3,335 a 2,124 tokens/turno), acelerando la inferencia del modelo y eliminando errores de duplicidad en terminal.
* **Asistente CLI Interactivo (`amiga-ia-setup`):** Herramienta desarrollada en Node.js que instala habilidades, realiza fusiones (*merge*) seguras con la configuración local de tus asistentes de IA, purga automáticamente sistemas heredados y audita la salud general del entorno.

### 3. Aprendizajes Clave (Key Learnings)
El desarrollo y evolución iterativa de Amiga IA hacia un ecosistema plenamente agéntico proporcionó valiosas lecciones de ingeniería de software e inteligencia artificial:
* **IA Agéntica vs. Prompts Pasivos:** Las instrucciones imperativas paso a paso tienden a romperse a medida que las bases de código crecen. Migrar hacia subagentes autónomos que razunan sobre objetivos globales, exploran el repositorio y coordinan revisiones en paralelo demostró ser exponencialmente más resistente, preciso y escalable que la ingeniería de prompts tradicional.
* **Economía de Tokens y Arquitectura Sin Estado:** Las primeras versiones del proyecto dependían de cachés obligatorias para persistir resúmenes locales de sesión. El análisis continuo demostró que arrastrar este contexto acumulado en cada inicio degradaba la velocidad de respuesta del modelo y elevaba innecesariamente el consumo de tokens. La retirada radical del estado de sesión en favor de inspecciones reactivas en tiempo real (ADR-003) devolvió al sistema su agilidad e inmediatez.
* **Mitigación de la Sobrecarga Silenciosa de Tokens:** Los catálogos dinámicos inyectados en el Prompt del Sistema generan un costo acumulativo severo durante sesiones largas. El reemplazo de etiquetas XML anidadas y extensas por índices relativos basados en atributos compactos erradicó el desperdicio redundante en memoria (ADR-004). Además, sustituir comandos en línea complejos por llamados a scripts externos estandarizados evitó fallos en la deduplicación de cadenas entre diferentes sistemas operativos.
* **Universalidad Multi-Ecosistema:** Lograr 100% de compatibilidad operativa entre motores con arquitecturas distintas (Claude Code de Anthropic y Antigravity de Google) en múltiples sistemas operativos requirió encapsular la lógica de interdicción en wrappers transversales de Node.js y normalizar el catálogo de herramientas mediante un índice XML dinámico y estricto.

### 4. Estructura del Repositorio
```text
amiga-ia/
├── package.json             # Registro del paquete NPM y Fuente Única de Verdad
├── agent/                   # Punto de entrada base para librerías del agente (agent.js)
├── adapters/                # Compilador del índice XML universal (universal_adapter.js)
├── agents/                  # Perfiles de Subagentes Autónomos en Markdown (ami-*.md)
├── docs/                    # Memoria persistente y árbol de documentación del proyecto
│   ├── adr/                 # Registros de Decisiones Arquitectónicas (ADRs)
│   ├── architecture/        # Guías técnicas de ingeniería (ej. universal adapter)
│   └── learning/            # Lecciones de sesión capturadas y patrones iterativos
├── skills/                  # Skills declarativas en Markdown (ami-*/SKILL.md)
├── hooks/                   # Hooks de seguridad nativos y scripts multiplataforma
│   ├── hooks.json           # Configuración para auto-descubrimiento en plugins
│   └── scripts/             # Scripts externos universales (.js, ami-hooks.ps1 y ami-hooks.sh)
├── hooks.json               # Configuración nativa de hooks de Claude Code (Motor Bash)
└── hooks-pwsh.json          # Configuración nativa de hooks de Claude Code (Motor PowerShell)
```

### 5. Skills y Agentes Incluidos

Todas las capacidades incluidas emplean de forma estricta el prefijo de espacio de nombres **`ami-`** para prevenir colisiones en el ecosistema.

| Tipo | Nombre | Descripción |
|---|---|---|
| Agente | **ami-data-scientist** | Agente maestro de la Suite de Datos y SQL. Orquesta análisis exploratorio, optimización de consultas en base de datos y dashboards ejecutivos. |
| Agente | **ami-doc-architect** | Agente maestro de documentación que orquesta en paralelo la creación de wikis, investigación de contexto externo y extracción de lecciones. |
| Agente | **ami-expert-council** | Convoca una mesa redonda de subagentes especializados para debatir, analizar y refinar una idea o decisión arquitectónica desde múltiples perspectives. |
| Agente | **ami-next-step-assistant** | Guía de proyecto automatizada que evalúa la salud del repositorio y recomienda el siguiente paso crítico en pruebas, deuda o calidad. |
| Agente | **ami-pr-publisher** | Agente maestro que ejecuta revisiones integrales, redacción de resúmenes ejecutivos y verificación de conflictos antes de publicar un Pull Request. |
| Agente | **ami-pr-reviewer** | Orquestador maestro que evalúa Pull Requests activos desplegando subagentes paralelos y descubrimiento automático de herramientas locales. |
| Agente | **ami-push-assistant** | Orquestador pre-push que ejecuta auditorías de calidad, escaneo de fugas de secretos y coherencia estructural antes de enviar código al remoto. |
| Agente | **ami-release-manager** | Orquestador central del ciclo de lanzamientos que calcula versiones semánticas, redacta changelogs bilingües y publica el release oficial en GitHub. |
| Agente | **ami-repo-auditor** | Agente maestro de auditoría que evalúa concurrentemente deuda técnica, higiene de librerías y vulnerabilidades en todo el código base. |
| Skill | **ami-plan-commits** | Analiza el árbol de trabajo actual, audita seguridad/secretos, planifica Conventional Commits/amend/squash y ejecuta las transacciones en Git. |
| Skill | **ami-research-context** | Investiga documentación externa actualizada en tiempo real y guarda hallazgos en referencias para evitar la obsolrescencia de contexto. |
| Skill | **ami-build-dashboard** | Construye dashboards web interactivos y visualizaciones profesionales en Python a partir de conjuntos de datos y KPIs. |
| Skill | **ami-profile-data** | Realiza análisis exploratorio de datos (EDA), cuantifica distribuciones nulas, detecta anomalías y audita validez metodológica. |
| Skill | **ami-validate-data** | Valida la consistencia estructural entre los cambios aplicados en el código y las definiciones del backend (esquemas y consultas BD). |
| Skill | **ami-analyze-dependencies** | Audita las librerías del proyecto para identificar paquetes sin uso, versiones obsoletas, vulnerabilidades o dependencias fantasma. |
| Skill | **ami-manage-docs** | Gestor integral de documentación. Detecta automáticamente si debe crear documentos desde cero o sincronizar wikis existentes con el historial de Git. |
| Skill | **ami-extract-learnings** | Analiza las modificaciones recientes en el código para documentar decisiones arquitectónicas, lecciones y antipatrones descubiertos en la sesión. |
| Skill | **ami-debug-issue** | Ejecuta un protocolo de depuración científica basado en evidencias, aislando causas raíz sin conjeturas y escribiendo pruebas automáticas. |
| Skill | **ami-analyze-pr-comments** | Procesa observaciones de revisión de código dejadas por compañeros de equipo en PRs activos, estructurando tareas pendientes y borradores de respuesta. |
| Skill | **ami-detect-pr-conflicts** | Se ejecuta antes de revisar o abrir un PR. Identifica colisiones en historiales de Git y posibles conflictos de merge entre ramas paralelas. |
| Skill | **ami-review-peer-pr** | Asiste en la revisión voluntaria de Pull Requests de otros desarrolladores, estructurando observaciones arquitectónicas y de lógica por nivel de criticidad. |
| Skill | **ami-review-self-pr** | Actúa como un exigente Ingeniero Senior revisando tu propio código antes de publicarlo, proponiendo y aplicando proactivamente correcciones locales. |
| Skill | **ami-project-architect** | Construye de forma interactiva la arquitectura base de un nuevo proyecto, stack tecnológico, árbol de directorios y un README inicial bilingüe. |
| Skill | **ami-audit-quality** | Audita los archivos modificados verificando legibilidad, diseño modular, principios DRY, seguridad y buenas prácticas del framework. |
| Skill | **ami-draft-release** | Se ejecuta antes de generar lanzamientos. Inspecciona commits para redactar notas de release bilingües categorizadas por mejoras y correcciones. |
| Skill | **ami-tag-release** | Se ejecuta antes de subir versiones. Analiza el historial de Git para calcular con precisión matemática la siguiente etiqueta semántica o Release Candidate. |
| Skill | **ami-optimize-sql** | Redacta y optimiza SQL multinivel (PostgreSQL, BigQuery, Snowflake, etc.), elimina anti-patrones y recomienda índices eficaces. |
| Skill | **ami-scan-tech-debt** | Escanea el repositorio buscando deuda técnica, módulos obsoletos, lógica duplicada, código muerto y marcadores pendientes (TODOs/FIXMEs). |
| Skill | **ami-create-tests** | Se ejecuta automáticamente cuando se incorpora código nuevo sin pruebas unitarias. Crea tests enfocados en proteger las nuevas funciones. |
| Skill | **ami-design-test-strategy** | Se ejecuta antes de programar tests. Diseña estrategias generales de QA, piramidación de pruebas, políticas de mocking y puertas de calidad en CI. |

### 6. Instalación y Uso
El método oficial y recomendado para integrar **Amiga IA** es mediante la instalación del paquete global de NPM:

```bash
npm install -g @anacatavc/amiga-ia
```

**Asistente Interactivo de Configuración (CLI):**
Ejecuta el asistente CLI para elegir tus entornos de IA activos (Claude Code, Antigravity o Ambos) y seleccionar tu motor de shell favorito (Bash, PowerShell nativo o scripts universales en Node.js):
```bash
amiga-ia-setup
```

**Herramienta de Diagnóstico del Sistema (`doctor`):**
Para verificar la salud y permisos del sistema, consultar incompatibilities del sistema operativo y validar que la sintaxis YAML frontmatter sea 100% correcta:
```bash
amiga-ia-setup doctor
```

> 💡 **Hooks de Seguridad y Selección de Motor:** Claude Code es compatible con recordatorios de pre-commit y bloqueos de seguridad. El asistente CLI fusiona limpiamente estas reglas ligeras en `~/.claude/settings.json`, generando un respaldo de seguridad en `~/.claude/settings.json.amiga-backup`. Google Antigravity ejecuta estas directrices nativamente mediante su pipeline atómico y el archivo de reglas `rules/ami-rules.md`.

#### 6.1 Directorios Globales Instalados
Al ejecutar `amiga-ia-setup`, el asistente estructura de forma segura las siguientes carpetas en el usuario raíz del sistema:

```text
~/.claude/                          # Configuración Global de Claude Code
├── skills/ami-*/SKILL.md           # Skills Declarativas (17 directorios)
├── agents/ami-*.md                 # Subagentes Autónomos (8 perfiles)
├── settings.json                   # Hooks Fusionados (PreToolUse, PostToolUse)
└── settings.json.amiga-backup      # Respaldo intacto del archivo original de usuario

~/.gemini/config/                   # Configuración Global de Antigravity (Gemini)
├── skills/ami-*/SKILL.md           # Skills Declarativas (17 directorios)
├── agents/ami-*.md                 # Subagentes Autónomos (8 perfiles)
└── rules/ami-rules.md              # Reglas Operativas Declarativas
```

### 7. Desinstalación
Para retirar limpiamente Amiga IA y devolver tu configuración al estado original:
1. Ejecuta `amiga-ia-setup` y selecciona la opción `u` (Uninstall) para eliminar en segundos todas las habilidades, subagentes, reglas y hooks fusionados.
2. Ejecuta `npm uninstall -g @anacatavc/amiga-ia` para retirar el paquete del sistema.

### 8. Extendiendo el Ecosistema
* **Convención Obligatoria (Prefijo `ami-`):** Toda habilidad o subagente personalizado DEBE llevar el prefijo de espacio de nombres `ami-` (ej. `ami-devops-checker`). Esto preserva el orden e impide choques con terceros.
* **Agregar una Nueva Skill:** Construye un directorio en `skills/ami-<nombre>/` que contenga un archivo `SKILL.md` estructurado con cabecera YAML frontmatter y cuerpo en Markdown.
* **Agregar un Nuevo Agente:** Crea un perfil de subagente autónomo en `agents/ami-<nombre>.md` detallando su personalidad, herramientas autorizadas y estrategias de delegación.
