const TOOL_CAPABILITY_MAP = {
  // Read capabilities
  Read: {
    claude: ['Read'],
    antigravity: ['view_file'],
    codex: ['Read']
  },
  view_file: {
    claude: ['Read'],
    antigravity: ['view_file'],
    codex: ['Read']
  },

  // Grep & Search
  Grep: {
    claude: ['Grep'],
    antigravity: ['grep_search'],
    codex: ['Grep']
  },
  grep_search: {
    claude: ['Grep'],
    antigravity: ['grep_search'],
    codex: ['Grep']
  },

  // File finding & directory listing
  Glob: {
    claude: ['Glob'],
    antigravity: ['find_by_name', 'list_dir'],
    codex: ['Glob']
  },
  find_by_name: {
    claude: ['Glob'],
    antigravity: ['find_by_name'],
    codex: ['Glob']
  },
  list_dir: {
    claude: ['Glob'],
    antigravity: ['list_dir'],
    codex: ['Glob']
  },

  // File creation (Write)
  Write: {
    claude: ['Write'],
    antigravity: ['write_to_file'],
    codex: ['Write']
  },
  write_to_file: {
    claude: ['Write'],
    antigravity: ['write_to_file'],
    codex: ['Write']
  },

  // File modification (Edit)
  Edit: {
    claude: ['Edit'],
    antigravity: ['replace_file_content', 'multi_replace_file_content'],
    codex: ['Edit']
  },
  replace_file_content: {
    claude: ['Edit'],
    antigravity: ['replace_file_content'],
    codex: ['Edit']
  },
  multi_replace_file_content: {
    claude: ['Edit'],
    antigravity: ['multi_replace_file_content'],
    codex: ['Edit']
  },

  // Terminal & Shell execution
  Bash: {
    claude: ['Bash'],
    antigravity: ['run_command', 'manage_task'],
    codex: ['Bash']
  },
  run_command: {
    claude: ['Bash'],
    antigravity: ['run_command'],
    codex: ['Bash']
  },
  manage_task: {
    claude: ['Bash'],
    antigravity: ['manage_task'],
    codex: ['Bash']
  },

  // Web search
  WebSearch: {
    claude: ['WebSearch'],
    antigravity: ['search_web'],
    codex: ['WebSearch']
  },
  search_web: {
    claude: ['WebSearch'],
    antigravity: ['search_web'],
    codex: ['WebSearch']
  },

  // Web fetch & HTTP inspection
  WebFetch: {
    claude: ['WebFetch'],
    antigravity: ['read_url_content'],
    codex: ['WebFetch']
  },
  read_url_content: {
    claude: ['WebFetch'],
    antigravity: ['read_url_content'],
    codex: ['WebFetch']
  },

  // Subagents & Inter-agent messaging
  Agent: {
    claude: ['Agent'],
    antigravity: ['invoke_subagent', 'send_message', 'define_subagent'],
    codex: ['Agent']
  },
  invoke_subagent: {
    claude: ['Agent'],
    antigravity: ['invoke_subagent'],
    codex: ['Agent']
  },
  send_message: {
    claude: ['Agent'],
    antigravity: ['send_message'],
    codex: ['Agent']
  },
  define_subagent: {
    claude: ['Agent'],
    antigravity: ['define_subagent'],
    codex: ['Agent']
  },

  // Questions / Interaction
  ask_question: {
    claude: [],
    antigravity: ['ask_question'],
    codex: []
  }
};

const WRITE_TOOL_IDENTIFIERS = new Set([
  'write',
  'edit',
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content'
]);

const AGENT_TOOL_IDENTIFIERS = new Set([
  'agent',
  'invoke_subagent',
  'define_subagent',
  'send_message'
]);

const SUPPORTED_PLATFORMS = new Set(['claude', 'antigravity', 'gemini', 'codex']);

const FORBIDDEN_CODEX_ANTIGRAVITY_TOOLS = new Set([
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content',
  'view_file',
  'grep_search',
  'find_by_name',
  'list_dir',
  'invoke_subagent',
  'ask_question'
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
    const matchToolLine = tools.match(/^(?:allowed-tools|tools):\s*(.+)$/m);
    const source = matchToolLine ? matchToolLine[1] : tools;
    return source.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Translates a tool list into the native target platform vocabulary.
 * @param {string|string[]} tools
 * @param {'claude'|'antigravity'|'gemini'|'codex'} platform
 * @returns {string[]}
 */
function translateTools(tools, platform) {
  if (typeof platform !== 'string' || !SUPPORTED_PLATFORMS.has(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const targetPlatform = platform === 'gemini' ? 'antigravity' : platform;
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
      // For codex, strictly drop any Antigravity proprietary tool identifiers
      if (targetPlatform === 'codex' && FORBIDDEN_CODEX_ANTIGRAVITY_TOOLS.has(tool)) {
        continue;
      }
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
 * Checks whether the given tool declaration grants subagent delegation capabilities.
 * @param {string|string[]} tools
 * @returns {boolean}
 */
function hasAgentCapabilities(tools) {
  const toolList = normalizeToolInput(tools);
  return toolList.some(tool => AGENT_TOOL_IDENTIFIERS.has(tool.toLowerCase()));
}

/**
 * Replaces tool declarations inside Markdown frontmatter with platform-translated equivalents.
 * @param {string} markdownContent
 * @param {'claude'|'antigravity'|'gemini'|'codex'} platform
 * @returns {string}
 */
function translateFrontmatter(markdownContent, platform) {
  if (typeof platform !== 'string' || !SUPPORTED_PLATFORMS.has(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

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
      const outputKey = (platform === 'antigravity' || platform === 'gemini')
        ? 'tools'
        : (platform === 'claude' ? 'allowed-tools' : key);
      updatedLines.push(`${outputKey}: ${translated.join(', ')}`);
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
  hasWriteCapabilities,
  hasAgentCapabilities
};
