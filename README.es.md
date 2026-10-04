<p align="center">
  <img src="icon.png" alt="amiga-ia Logo" width="120" />
</p>

# Amiga IA - Autonomous Agentic Suite & Declarative Skills

[English](README.md) | [Español](README.es.md)

[![NPM](https://img.shields.io/badge/NPM-Package-CB3837?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com/package/@anacatavc/amiga-ia)
[![Antigravity](https://img.shields.io/badge/Antigravity-Gemini-8E24AA?style=flat&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Anthropic-D97757?style=flat&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-blue.svg?style=flat)](LICENSE)

> 🎶 Inspiración del nombre: [Amiga Mía - Los Prisioneros](https://www.youtube.com/watch?v=qPHaLk4-_Ew)  
> 🌐 Página web del producto: [amiga-ia.ana-catalina.com](https://amiga-ia.ana-catalina.com/)

---


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
│   ├── hooks.json           # Copia generada de hooks.json (npm run build)
│   └── scripts/             # Scripts externos universales (.js, ami-hooks.ps1 y ami-hooks.sh)
├── hooks.json               # Configuración nativa de hooks de Claude Code (Motor Bash)
└── hooks-pwsh.json          # Configuración nativa de hooks de Claude Code (Motor PowerShell)
```

### 5. Skills y Agentes Incluidos

Todas las capacidades incluidas emplean de forma estricta el prefijo de espacio de nombres **`ami-`** para prevenir colisiones en el ecosistema.

| Tipo | Nombre | Descripción |
|---|---|---|
| Agente | **ami-cleanroom-builder** | Implementador de código de producción para flujos Cleanroom TDD. Programa respetando estrictamente los contratos de interfaz sin sobreajustarse a los tests. |
| Agente | **ami-cleanroom-tester** | Arquitecto de pruebas de caja negra independiente para Cleanroom TDD. Genera suites exhaustivas a partir de contratos y criterios de aceptación, aislado del código fuente. |
| Agente | **ami-data-scientist** | Agente maestro de la Suite de Datos y SQL. Orquesta análisis exploratorio, optimización de consultas en base de datos y dashboards ejecutivos. |
| Agente | **ami-doc-architect** | Agente maestro de documentación y ciclo de vida del conocimiento. Orquesta en paralelo wikis, auditorías de obsolescencia, investigación y lecciones. |
| Agente | **ami-expert-council** | Convoca una mesa redonda de subagentes especializados para debatir, analizar y refinar una idea o decisión arquitectónica desde múltiples perspectivas. |
| Agente | **ami-pr-publisher** | Agente maestro que ejecuta revisiones integrales, redacción de resúmenes ejecutivos y verificación de conflictos antes de publicar un Pull Request. |
| Agente | **ami-pr-reviewer** | Orquestador maestro que evalúa Pull Requests mediante modos duales (Revisión Estática vs Revisión Completa con ejecución de tests), ingesta de contexto y pistas de auditoría adversarial. |
| Agente | **ami-push-assistant** | Orquestador pre-push que ejecuta auditorías de calidad, escaneo de fugas de secretos y coherencia estructural antes de enviar código al remoto. |
| Agente | **ami-release-manager** | Orquestador central del ciclo de lanzamientos que calcula versiones semánticas, redacta changelogs bilingües y publica el release oficial en GitHub. |
| Agente | **ami-repo-auditor** | Agente maestro de auditoría que evalúa concurrentemente deuda técnica, higiene de librerías y vulnerabilidades en todo el código base. |
| Agente | **ami-tech-lead** | Agente maestro de planificación y arquitectura. Evalúa la salud del repositorio, planifica nuevas características y guía decisiones técnicas. |
| Skill | **ami-analyze-dependencies** | Audita las librerías del proyecto para identificar paquetes sin uso, versiones obsoletas, vulnerabilidades o dependencias fantasma. |
| Skill | **ami-analyze-pr-comments** | Procesa observaciones de revisión de código dejadas por compañeros de equipo en PRs activos, estructurando tareas pendientes y borradores de respuesta. |
| Skill | **ami-architect-project** | Construye de forma interactiva la arquitectura base de un nuevo proyecto, stack tecnológico, árbol de directorios y un README inicial bilingüe. |
| Skill | **ami-audit-quality** | Audita los archivos modificados verificando legibilidad, diseño modular, principios DRY, seguridad y buenas prácticas del framework. |
| Skill | **ami-build-dashboard** | Construye dashboards web interactivos y visualizaciones profesionales en Python a partir de conjuntos de datos y KPIs. |
| Skill | **ami-create-tests** | Se ejecuta automáticamente cuando se incorpora código nuevo sin pruebas unitarias. Crea tests enfocados en proteger las nuevas funciones. |
| Skill | **ami-debug-issue** | Ejecuta un protocolo de depuración científica basado en evidencias, aislando causas raíz sin conjeturas y escribiendo pruebas automáticas. |
| Skill | **ami-design-test-strategy** | Se ejecuta antes de programar tests. Diseña estrategias generales de QA, piramidación de pruebas, políticas de mocking y puertas de calidad en CI. |
| Skill | **ami-detect-pr-conflicts** | Se ejecuta antes de revisar o abrir un PR. Identifica colisiones en historiales de Git y posibles conflictos de merge entre ramas paralelas. |
| Skill | **ami-draft-release** | Se ejecuta antes de generar lanzamientos. Inspecciona commits para redactar notas de release bilingües categorizadas por mejoras y correcciones. |
| Skill | **ami-extract-learnings** | Analiza las modificaciones recientes en el código para documentar decisiones arquitectónicas, lecciones y antipatrones descubiertos en la sesión. |
| Skill | **ami-guide-next-step** | Escanea la salud multidimensional del proyecto priorizando deuda técnica, calidad y pruebas, y recomienda el siguiente paso óptimo. |
| Skill | **ami-manage-docs** | Gestor integral de documentación y conocimiento. Detecta si debe crear documentos, sincronizar wikis con Git o auditar y depurar lecciones obsoletas. |
| Skill | **ami-optimize-sql** | Redacta y optimiza SQL multinivel (PostgreSQL, BigQuery, Snowflake, etc.), elimina anti-patrones y recomienda índices eficaces. |
| Skill | **ami-orchestrate-cleanroom** | Orquestador maestro de TDD Cleanroom (Doble Ciego). Aclara interactivamente dudas de interfaz y sugerencias, congela contratos, despacha subagentes aislados de código y testing, ejecuta pruebas y arbitra discrepancias. |
| Skill | **ami-plan-commits** | Analiza el árbol de trabajo actual, audita seguridad/secretos, planifica Conventional Commits/amend/squash y ejecuta las transacciones en Git. |
| Skill | **ami-plan-feature** | Flujo interactivo de planificación de características y orquestación de arquitectura. Aclara dudas y propone alternativas técnicas con el usuario antes de investigar y redactar planes. |
| Skill | **ami-profile-data** | Realiza análisis exploratorio de datos (EDA), cuantifica distribuciones nulas, detecta anomalías y audita validez metodológica. |
| Skill | **ami-research-context** | Investiga documentación externa actualizada en tiempo real y guarda hallazgos en referencias para evitar la obsolescencia de contexto. |
| Skill | **ami-review-peer-pr** | Conduce revisiones en PRs de terceros con trazabilidad de criterios de aceptación, modos duales y auditoría de falsificación adversarial ([Falsification Check]) para eliminar falsos positivos. |
| Skill | **ami-review-self-pr** | Actúa como un exigente Ingeniero Senior revisando tu propio código mediante modos duales, sondeos adversariales de 5 dimensiones ([Blind-Spot Probe]) y bucles de remediación local de tests. |
| Skill | **ami-scan-tech-debt** | Escanea el repositorio buscando deuda técnica, módulos obsoletos, lógica duplicada, código muerto y marcadores pendientes (TODOs/FIXMEs). |
| Skill | **ami-stress-test-idea** | Ejecuta pruebas de estrés adversariales y análisis premortem en propuestas técnicas, detectando SPOFs, fallos de concurrencia y costos ocultos. |
| Skill | **ami-tag-release** | Se ejecuta antes de subir versiones. Analiza el historial de Git para calcular con precisión matemática la siguiente etiqueta semántica o Release Candidate. |
| Skill | **ami-validate-data** | Valida la consistencia estructural entre los cambios aplicados en el código y las definiciones del backend (esquemas y consultas BD). |

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
├── skills/ami-*/SKILL.md           # Skills Declarativas (25 directorios)
├── agents/ami-*.md                 # Subagentes Autónomos (11 perfiles)
├── settings.json                   # Hooks Fusionados (PreToolUse, PostToolUse)
└── settings.json.amiga-backup      # Respaldo intacto del archivo original de usuario

~/.gemini/config/                   # Configuración Global de Antigravity (Gemini)
├── skills/ami-*/SKILL.md           # Skills Declarativas (25 directorios)
├── agents/ami-*.md                 # Subagentes Autónomos (11 perfiles)
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

---

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

