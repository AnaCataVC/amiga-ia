# Amiga IA — Catálogo Completo de Capacidades

[English](catalog.md) | [Español](catalog.es.md)

Especificación completa y matriz funcional de las **36 capacidades (14 subagentes autónomos y 22 skills declarativas)** incluidas en el ecosistema Amiga IA. Todas las capacidades se adhieren estrictamente al prefijo de espacio de nombres `ami-`.

---

## 1. Orquestadores Maestros y Revisión de Código

Subagentes autónomos y skills que coordinan flujos de trabajo multi-hilo, realizan inspecciones profundas de Pull Requests y efectúan auditorías de falsificación adversarial.

| Componente | Tipo | Responsabilidad y Capacidades |
|---|---|---|
| **`ami-tech-lead`** | Agente | Orquestador maestro de arquitectura y planificación. Evalúa la salud del repositorio, diseña planos arquitectónicos, desglosa requerimientos y hace cumplir contratos modulares. |
| **`ami-pr-reviewer`** | Agente | Orquestador de revisión de PRs que evalúa cambios mediante modos duales (Revisión Estática vs Revisión Dinámica con ejecución de tests), ingestión de contexto y trazabilidad adversarial. |
| **`ami-pr-publisher`** | Agente | Orquestador que realiza la revisión previa, redacción de resúmenes estructurados y auditoría de conflictos de fusión antes de publicar un Pull Request. |
| **`ami-push-assistant`** | Agente | Asistente de pre-push que verifica compresión de calidad, escanea secretos y tokens API en texto plano, y comprueba suites de tests antes de enviar cambios al repositorio remoto. |
| **`ami-expert-council`** | Agente | Convoca un consejo de subagentes especializados para debatir y someter a prueba de estrés propuestas arquitectónicas desde perspectivas ortogonales en un solo pase. |
| **`ami-review-self-pr`** | Skill | Actúa como un Ingeniero Senior riguroso auditando código local en curso, aplicando sondeos de 5 dimensiones (`[Blind-Spot Probe]`) y ciclos de remediación autónoma. |
| **`ami-review-peer-pr`** | Skill | Realiza revisiones de código en PRs de compañeros con trazabilidad hacia criterios de aceptación y auditorías de falsificación (`[Falsification Check]`) para eliminar falsas alarmas. |
| **`ami-analyze-pr-comments`** | Skill | Analiza observaciones dejadas por revisores en PRs activos, estructurando planes de acción y formulando respuestas técnicas precisas. |
| **`ami-detect-pr-conflicts`** | Skill | Identifica commits superpuestos y posibles conflictos de merge entre ramas activas antes de crear o proponer Pull Requests. |
| **`ami-plan-commits`** | Skill | Analiza el árbol de trabajo de git, ejecuta auditorías de seguridad, planifica commits convencionales y coordina acciones de versionado. |

---

## 2. Pruebas y TDD Cleanroom (Doble Ciego)

Componentes que aplican el aislamiento estricto de Ingeniería de Software Cleanroom (Harlan Mills), erradicando el sesgo de confirmación y el sobreajuste de tests en LLMs.

| Componente | Tipo | Responsabilidad y Capacidades |
|---|---|---|
| **`ami-cleanroom-arbiter`** | Agente | Árbitro maestro de TDD Cleanroom. Congela contratos formales de interfaz (`docs/contracts/`), despacha agentes aislados de implementación y testing, ejecuta suites de prueba y adjudica fallos. |
| **`ami-cleanroom-builder`** | Agente | Implementador de código de producción para TDD Cleanroom. Escribe código estrictamente a partir de contratos formales sin acceso al código de los tests. |
| **`ami-cleanroom-tester`** | Agente | Diseñador de pruebas de caja negra para TDD Cleanroom. Genera tests de límites y casos negativos estrictamente a partir de contratos, aislado del código de producción. |
| **`ami-orchestrate-cleanroom`** | Skill | Flujo de orquestación de TDD Cleanroom. Clarifica especificaciones, congela contratos de interfaz formales, despacha agentes aislados y coordina ciclos de arbitraje. |
| **`ami-design-test-strategy`** | Skill | Diseña estrategias de prueba integrales, distribución de pirámide de testing (Unit, Integration, E2E), límites de simulación (mocking) y quality gates antes de codificar. |
| **`ami-create-tests`** | Skill | Genera pruebas unitarias y de regresión enfocadas en código recién modificado que carece de cobertura automatizada. |

---

## 3. Arquitectura, Higiene de Código y Ciclo de Vida del Conocimiento

Herramientas para auditar deuda técnica, gestionar registros de decisiones arquitectónicas (ADRs), evaluar dependencias y mantener la memoria del repositorio.

| Componente | Tipo | Responsabilidad y Capacidades |
|---|---|---|
| **`ami-repo-auditor`** | Agente | Orquestador maestro que evalúa concurrentemente deuda técnica, higiene de dependencias y vulnerabilidades de seguridad en todos los módulos del repositorio. |
| **`ami-doc-architect`** | Agente | Orquestador maestro de documentación. Coordina la creación de documentación técnica, auditorías de obsolescencia, investigación de contexto y extracción de aprendizajes. |
| **`ami-release-manager`** | Agente | Orquestador central que calcula etiquetas de versión semántica, redacta notas de lanzamiento bilingües y automatiza publicaciones en GitHub Releases. |
| **`ami-audit-quality`** | Skill | Inspecciona código modificado evaluando mantenibilidad, buenas prácticas de diseño modular, seguridad, consistencia de esquemas de datos y solidez estructural. |
| **`ami-scan-tech-debt`** | Skill | Escanea el repositorio en busca de deuda técnica, importaciones obsoletas, duplicidad lógica, código muerto y comentarios pendientes (TODOs/FIXMEs). |
| **`ami-analyze-dependencies`** | Skill | Audita la salud de las librerías del proyecto, detectando dependencias no utilizadas, desactualizadas, vulnerables o fantasma en manifiestos de paquetes. |
| **`ami-manage-docs`** | Skill | Administrador integral de documentación y memoria. Diseña nueva documentación, sincroniza wikis con diffs de código, cosecha aprendizajes y poda notas obsoletas. |
| **`ami-research-context`** | Skill | Investiga documentación externa y puntos de referencia actualizados, persistiendo hallazgos en `docs/external-references/` para evitar degradación de contexto. |
| **`ami-prepare-release`** | Skill | Calcula etiquetas semánticas y redacta notas de lanzamiento bilingües (inglés y español) a partir del historial git en un flujo atómico previo al etiquetado. |
| **`ami-debug-issue`** | Skill | Aplica un proceso de depuración sistemático y basado en evidencia, aislando la causa raíz sin suposiciones y redactando tests de regresión. |
| **`ami-architect-project`** | Skill | Configura de forma interactiva la arquitectura inicial de proyectos, evaluando tecnologías, estructura de carpetas y documentación base bilingüe. |
| **`ami-plan-feature`** | Skill | Flujo interactivo de planificación de características. Clarifica ambigüedades y propone alternativas arquitectónicas antes de redactar planes de implementación. |
| **`ami-stress-test-idea`** | Skill | Conduce análisis adversarial *pre-mortem* sobre propuestas técnicas, exponiendo puntos únicos de fallo (SPOFs), condiciones de carrera y explosión de costes. |

---

## 4. Prototipado de UI y Auditoría de Consistencia

Agentes y habilidades especializadas para la creación ágil de prototipos visuales interactivos y auditoría de tokens de diseño.

| Componente | Tipo | Responsabilidad y Capacidades |
|---|---|---|
| **`ami-ui-builder`** | Agente | Especialista maestro en prototipado de interfaces. Construye maquetas interactivas en HTML5 y Tailwind CSS y especificaciones vivas sin saturar la ventana de contexto principal. |
| **`ami-prototype-ui`** | Skill | Genera maquetas autocontenidas e interactivas en HTML5 y Tailwind CSS (`docs/mockups/`) para la validación visual rápida de requerimientos. |
| **`ami-audit-ui-consistency`** | Skill | Audita código y recursos de UI en web, escritorio y móvil para verificar adherencia a tokens de diseño, jerarquía de botones, estados interactivos y ausencia de iconos duplicados. |

---

## 5. Ciencia de Datos y Optimización SQL

Capacidades analíticas para optimización de consultas en bases de datos, perfilado de datos y diseño de paneles ejecutivos.

| Componente | Tipo | Responsabilidad y Capacidades |
|---|---|---|
| **`ami-data-scientist`** | Agente | Orquestador maestro para Datos y SQL. Coordina análisis exploratorio, auditoría de sesgos en datos, optimización de consultas SQL y dashboards analíticos. |
| **`ami-optimize-sql`** | Skill | Escribe y optimiza consultas SQL en los principales motores, diagnostica antipatrones de ejecución, recomienda índices y refactoriza joins en CTEs limpios. |
| **`ami-build-dashboard`** | Skill | Construye paneles web interactivos y visualizaciones estadísticas en Python a partir de datasets analíticos y KPIs. |
