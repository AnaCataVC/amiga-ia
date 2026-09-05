# Estándares de Documentación y Política de Cero Banderas

Este archivo establece las directrices obligatorias para la creación, estructuración y mantenimiento de documentación técnica, archivos `README.md`, notas de lanzamiento y componentes de interfaz en repositorios de código.

---

## 1. Política Estricta de Cero Banderas (Zero Flags Policy)

Queda **ESTRICTAMENTE PROHIBIDO** el uso de emojis de banderas (tales como US, UK, ES, MX, etc.), imágenes o iconos de banderas de países en cualquier elemento de documentación o interfaz del repositorio.

### Invariantes y Fundamentos:
1. **Precisión Semántica e Inclusiva:** Las banderas representan estados soberanos y entidades geopolíticas, **nunca lenguajes**. El idioma español es hablado en más de 20 países y el inglés en decenas; asociar una bandera nacional a un idioma completo invisibiliza la diversidad cultural y geográfica de la comunidad hablante.
2. **Degradación Visual y Renderizado Roto en Windows:** En plataformas Windows (consolas PowerShell, CMD, terminales de VS Code, controles UI WPF/WinUI y diversos parsers Markdown), los glifos de banderas (Unicode Regional Indicator Symbols) no se muestran como iconos gráficos a color. Se descomponen en pares de letras aisladas (ej. `[U][S]`, `[E][S]`), caracteres monocromáticos toscos o bloques "tofu" de caracteres no imprimibles.
3. **Higiene y Profesionalismo de Portafolio:** La documentación técnica de ingeniería de software de alto nivel debe emplear tipografía limpia, semántica y accesible.

### Matriz de Cumplimiento:

| Elemento | Prohibido | Permitido y Obligatorio |
| :--- | :--- | :--- |
| **Enlaces de Navegación** | `[Flag English](#english) • [Flag Español](#español)` | `[English](#english) • [Español](#español)` |
| **Encabezados de Idioma** | `## Flag English` | `## English` o `<a name="english"></a>\n## English` |
| **Encabezados en Español** | `## Flag Español` | `## Español` o `<a name="español"></a>\n## Español` |
| **Separadores en Releases** | `# Flag Release v1.0` / `### Flag Nuevas Funciones` | `# Release v1.0` / `### Nuevas Funcionalidades` |
| **Badges de Idioma** | `![Lang](...badge/idioma-Español_Flag-blue)` | `![Lang](...badge/idioma-Español-blue)` |
| **Selectores de UI / Web** | Botones o items con emojis de banderas | Texto limpio (`English`, `Español`) o icono neutro de globo |

---

## 2. Estándares de Navegación Bilingüe y Anclas HTML

Cuando un repositorio requiera documentación bilingüe (Inglés y Español):
1. **Cabecera de Navegación:** Colocar inmediatamente después del subtítulo o badges del proyecto una barra de salto limpia:
   ```markdown
   [English](#english) • [Español](#español)
   ```
2. **Anclas HTML Explícitas:** Para garantizar que los saltos funcionen en GitHub, GitLab, VS Code y renderizadores web sin depender de la generación automática de IDs de encabezados con caracteres especiales:
   ```markdown
   <a name="english"></a>
   ## English
   
   ...
   
   <a name="español"></a>
   ## Español
   ```
3. **Archivos Separados (Alternativa Aprobada):** En repositorios grandes, separar la documentación en `README.md` (Inglés por defecto) y `README.es.md` (Español), enlazados mutuamente en el encabezado:
   ```markdown
   *Read this in [Español](README.es.md)*
   ```

---

## 3. Privacidad de Rutas Locales (Path Privacy)

- **NUNCA** incluir rutas absolutas de la máquina local (ej. `/path/to/project`) en `README.md`, guías técnicas, ejemplos de comandos o documentación de arquitectura.
- Emplear siempre rutas relativas (ej. `.\scripts\build.ps1`), variables de entorno estándar (ej. `%LOCALAPPDATA%\AppName\Logs`), o rutas ficticias/genéricas.

---

## 4. Badges de Shields.io Limpios

- Los badges técnicos deben reflejar tecnologías, versiones, cobertura de pruebas, compatibilidad de plataformas y licencias con logos oficiales (`logo=...`) y estilo consistente (`style=flat-square` o similar).
- No saturar badges con emojis innecesarios ni banderas de países.
