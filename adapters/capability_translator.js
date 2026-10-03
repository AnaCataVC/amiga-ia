const TOOL_CAPABILITY_MAP = {
  // Read capabilities
  Read: {
    claude: ['Read'],
    antigravity: ['view_file']
  },
  view_file: {
    claude: ['Read'],
    antigravity: ['view_file']
  },

  // Grep & Search
  Grep: {
    claude: ['Grep'],
    antigravity: ['grep_search']
  },
  grep_search: {
    claude: ['Grep'],
    antigravity: ['grep_search']
  },

  // File finding & directory listing
  Glob: {
    claude: ['Glob'],
    antigravity: ['find_by_name', 'list_dir']
  },
  find_by_name: {
    claude: ['Glob'],
    antigravity: ['find_by_name']
  },
  list_dir: {
    claude: ['Glob'],
    antigravity: ['list_dir']
  },

  // File creation (Write)
  Write: {
    claude: ['Write'],
    antigravity: ['write_to_file']
  },
  write_to_file: {
    claude: ['Write'],
    antigravity: ['write_to_file']
  },

  // File modification (Edit)
  Edit: {
    claude: ['Edit'],
    antigravity: ['replace_file_content', 'multi_replace_file_content']
  },
  replace_file_content: {
    claude: ['Edit'],
    antigravity: ['replace_file_content']
  },
  multi_replace_file_content: {
    claude: ['Edit'],
    antigravity: ['multi_replace_file_content']
  },

  // Terminal & Shell execution
  Bash: {
    claude: ['Bash'],
    antigravity: ['run_command', 'manage_task']
  },
  run_command: {
    claude: ['Bash'],
    antigravity: ['run_command']
  },
  manage_task: {
    claude: ['Bash'],
    antigravity: ['manage_task']
  },

  // Web search
  WebSearch: {
    claude: ['WebSearch'],
    antigravity: ['search_web']
  },
  search_web: {
    claude: ['WebSearch'],
    antigravity: ['search_web']
  },

  // Web fetch & HTTP inspection
  WebFetch: {
    claude: ['WebFetch'],
    antigravity: ['read_url_content']
  },
  read_url_content: {
    claude: ['WebFetch'],
    antigravity: ['read_url_content']
  },

  // Subagents & Inter-agent messaging
  Agent: {
    claude: ['Agent'],
    antigravity: ['invoke_subagent', 'send_message', 'define_subagent']
  },
  invoke_subagent: {
    claude: ['Agent'],
    antigravity: ['invoke_subagent']
  },
  send_message: {
    claude: ['Agent'],
    antigravity: ['send_message']
  },
  define_subagent: {
    claude: ['Agent'],
    antigravity: ['define_subagent']
  }
};

const WRITE_TOOL_IDENTIFIERS = new Set([
  'write',
  'edit',
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content'
]);

/**
 * Normalizes an array or comma-separated string of tools.
 * @param {string|string[]} tools
 * @returns {string[]}
 */
function normalizeToolInput(tools) {
  if (Array.isArray(tools)) {
    return tools.flatMap(t => String(t).split(',')).map(t => t.trim()).filter(Boolean);
  }
  if (typeof tools === 'string') {
    return tools.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Translates a tool list into the native target platform vocabulary.
 * @param {string|string[]} tools
 * @param {'claude'|'antigravity'|'gemini'} platform
 * @returns {string[]}
 */
function translateTools(tools, platform) {
  const targetPlatform = platform === 'claude' ? 'claude' : 'antigravity';
  const toolList = normalizeToolInput(tools);
  const result = [];
  const seen = new Set();

  for (const tool of toolList) {
    const mapping = TOOL_CAPABILITY_MAP[tool];
    if (mapping && mapping[targetPlatform]) {
      for (const mappedTool of mapping[targetPlatform]) {
        if (!seen.has(mappedTool)) {
          seen.add(mappedTool);
          result.push(mappedTool);
        }
      }
    } else {
      // Passthrough unknown, custom, or MCP tools
      if (!seen.has(tool)) {
        seen.add(tool);
        result.push(tool);
      }
    }
  }

  return result;
}

/**
 * Checks whether the given tool declaration grants write or edit capabilities.
 * @param {string|string[]} tools
 * @returns {boolean}
 */
function hasWriteCapabilities(tools) {
  const toolList = normalizeToolInput(tools);
  return toolList.some(tool => WRITE_TOOL_IDENTIFIERS.has(tool.toLowerCase()));
}

/**
 * Replaces tool declarations inside Markdown frontmatter with platform-translated equivalents.
 * @param {string} markdownContent
 * @param {'claude'|'antigravity'|'gemini'} platform
 * @returns {string}
 */
function translateFrontmatter(markdownContent, platform) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = markdownContent.match(frontmatterRegex);
  if (!match) return markdownContent;

  const yamlBlock = match[1];
  const isCrlf = match[0].includes('\r\n');
  const newline = isCrlf ? '\r\n' : '\n';

  let hasReplaced = false;
  const yamlLines = yamlBlock.split(/\r?\n/);
  const updatedLines = [];

  for (let i = 0; i < yamlLines.length; i++) {
    const line = yamlLines[i];
    const matchToolKey = line.match(/^(allowed-tools|tools):\s*(.*)$/);

    if (matchToolKey) {
      const key = matchToolKey[1];
      let rawTools = matchToolKey[2].trim();

      // Check if tools are written as a YAML list on subsequent lines
      if (!rawTools && i + 1 < yamlLines.length && yamlLines[i + 1].trim().startsWith('-')) {
        const listItems = [];
        let j = i + 1;
        while (j < yamlLines.length && yamlLines[j].trim().startsWith('-')) {
          listItems.push(yamlLines[j].trim().replace(/^-\s*/, '').trim());
          j++;
        }
        i = j - 1;
        rawTools = listItems.join(', ');
      }

      const translated = translateTools(rawTools, platform);
      updatedLines.push(`${key}: ${translated.join(', ')}`);
      hasReplaced = true;
    } else {
      updatedLines.push(line);
    }
  }

  if (!hasReplaced) return markdownContent;

  const newYaml = updatedLines.join(newline);
  return markdownContent.replace(frontmatterRegex, `---${newline}${newYaml}${newline}---`);
}

module.exports = {
  TOOL_CAPABILITY_MAP,
  translateTools,
  translateFrontmatter,
  hasWriteCapabilities
};
