const fs = require('fs');
const path = require('path');

/**
 * Universal Adapter for Agent Skills
 * Generates an XML `<available_skills>` block using Lazy Loading.
 */
class UniversalAdapter {
  constructor(environment) {
    this.environment = environment; // 'claude' or 'antigravity'
  }

  /**
   * Scans a directory for SKILL.md or .md files, extracts frontmatter,
   * and returns the XML block to be injected into the System Prompt.
   */
  generateSkillsXml(baseDir) {
    const skills = [];
    
    if (!fs.existsSync(baseDir)) return '';

    // Recursively find all SKILL.md or .md files
    const walkSync = (dir, filelist = []) => {
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
          filelist = walkSync(filepath, filelist);
        } else if (file === 'SKILL.md' || file.endsWith('.md')) {
          filelist.push(filepath);
        }
      });
      return filelist;
    };

    const files = walkSync(baseDir);

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      
      let name = path.basename(path.dirname(file));
      let description = 'No description provided.';
      
      if (match && match[1]) {
        const yamlLines = match[1].split('\n');
        yamlLines.forEach(line => {
          if (line.startsWith('name:')) name = line.replace('name:', '').trim();
          if (line.startsWith('description:')) description = line.replace('description:', '').trim();
        });
      }

      skills.push(`  <skill>\n    <name>${name}</name>\n    <description>${description}</description>\n    <location>${file}</location>\n  </skill>`);
    });

    if (skills.length === 0) return '';

    return [
      '<available_skills>',
      ...skills,
      '</available_skills>',
      'If you need to use a skill, use your file reading tool to read the file at <location> and follow its instructions.'
    ].join('\n');
  }

  getSystemPrompt(skillsDir) {
    const xml = this.generateSkillsXml(skillsDir);
    return `You are operating in the ${this.environment} environment.\n${xml}`;
  }
}

module.exports = UniversalAdapter;
