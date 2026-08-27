# Pattern: Idempotent Markdown Mutation & Cross-Engine AI Rules Distribution

## Context & Challenge

Distributing behavioral steering rules to AI development assistants (e.g., Claude Code and Google Antigravity) involves bridging two distinct architectural paradigms:
1. **Modular Rule Directories:** Systems like Antigravity support directory-based discovery where modular `.md` files are dropped into `~/.gemini/config/rules/`.
2. **Shared Monolithic Memory Files:** Systems like Claude Code rely on shared markdown files (`~/.claude/CLAUDE.md`) that contain bespoke user directives and personal preferences.

Injecting managed system instructions into shared markdown files without proper isolation leads to:
- **Destructive Clobbering:** Overwriting pre-existing developer instructions.
- **Directive Duplication:** Successive CLI runs appending redundant blocks, creating massive context window token bloat.
- **Uninstallation Damage:** Blindly unlinking the file on uninstall, wiping the developer's personal settings.

---

## The Solution Pattern: Delimited Block Mutation

### 1. Delimited HTML Comments Block Protocol
Wrap package-managed markdown blocks in structured HTML comment tags that are invisible when rendered in Markdown previews but easily identifiable via regex:

```javascript
function mergeMarkdownBlock(filePath, blockContent, blockId = 'AMIGA_IA_RULES') {
  const startTag = `<!-- ${blockId}_START:DO_NOT_EDIT -->`;
  const endTag = `<!-- ${blockId}_END -->`;
  const formattedBlock = `${startTag}\n${blockContent.trim()}\n${endTag}`;

  let originalContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const normalizedContent = originalContent.replace(/\r\n/g, '\n');
  const regex = new RegExp(`<!--\\s*${blockId}_START:DO_NOT_EDIT\\s*-->[\\s\\S]*?<!--\\s*${blockId}_END\\s*-->`, 'g');

  let newContent = '';
  if (regex.test(normalizedContent)) {
    newContent = normalizedContent.replace(regex, formattedBlock);
  } else {
    newContent = normalizedContent.trim() ? `${normalizedContent.trim()}\n\n${formattedBlock}\n` : `${formattedBlock}\n`;
  }
  
  // Atomic write to avoid partial updates
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.amiga-tmp`);
  fs.writeFileSync(tmpPath, newContent.replace(/\n/g, os.EOL));
  fs.renameSync(tmpPath, filePath);
}
```

### 2. Surgical Removal on Uninstall
When uninstalling, extract the managed block without destroying remaining user content:

```javascript
function removeMarkdownBlock(filePath, blockId = 'AMIGA_IA_RULES') {
  if (!fs.existsSync(filePath)) return false;
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const normalizedContent = originalContent.replace(/\r\n/g, '\n');
  const regex = new RegExp(`\\n*<!--\\s*${blockId}_START:DO_NOT_EDIT\\s*-->[\\s\\S]*?<!--\\s*${blockId}_END\\s*-->\\n*`, 'g');

  if (!regex.test(normalizedContent)) return false;

  let newContent = normalizedContent.replace(regex, '\n').trim();
  if (newContent.length > 0) {
    newContent += '\n';
    fs.writeFileSync(filePath, newContent.replace(/\n/g, os.EOL));
  } else {
    fs.unlinkSync(filePath);
  }
  return true;
}
```

### 3. Zero-Token Overhead via Interactive Confirmation
Never force system rules unconditionally. Providing interactive opt-in prompts (`confirm({ message: 'Install recommended rules...?' })`) ensures that developers who prefer zero prompt interference maintain a pure 0-token overhead.

---

## Best Practice Takeaway
When modifying shared markdown configuration files in developer environments, never perform raw appends or full overwrites. Use the Delimited HTML Comments Block Protocol combined with atomic temporary file writes to guarantee idempotent updates, safe surgical uninstallation, and zero interference with developer customizations.
