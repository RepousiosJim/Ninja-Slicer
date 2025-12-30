#!/usr/bin/env node

// Scan for TODO/FIXME/BUG comments and create tasks in Notion

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');
const {
  createDatabasePage,
  queryDatabase,
  titleProperty,
  selectProperty,
  multiSelectProperty,
  safeExecute,
  logger
} = require('./utils.cjs');

// Patterns to search for
const TODO_PATTERNS = [
  { pattern: /\/\/\s*TODO[:\s]+(.+)/gi, type: 'Feature' },
  { pattern: /\/\/\s*FIXME[:\s]+(.+)/gi, type: 'Bug' },
  { pattern: /\/\/\s*BUG[:\s]+(.+)/gi, type: 'Bug' },
  { pattern: /\/\/\s*HACK[:\s]+(.+)/gi, type: 'Refactor' },
  { pattern: /\/\/\s*XXX[:\s]+(.+)/gi, type: 'Bug' },
  { pattern: /\/\/\s*NOTE[:\s]+(.+)/gi, type: 'Documentation' },
  { pattern: /\/\/\s*OPTIMIZE[:\s]+(.+)/gi, type: 'Refactor' }
];

// Scan a file for TODO comments
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const todos = [];

  lines.forEach((line, index) => {
    TODO_PATTERNS.forEach(({ pattern, type }) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        todos.push({
          text: match[1].trim(),
          file: filePath,
          line: index + 1,
          type: type,
          priority: determinePriority(match[1])
        });
      }
    });
  });

  return todos;
}

// Determine priority from comment text
function determinePriority(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('urgent') || lowerText.includes('asap')) {
    return 'Critical';
  }
  if (lowerText.includes('important') || lowerText.includes('high')) {
    return 'High';
  }
  if (lowerText.includes('low') || lowerText.includes('minor')) {
    return 'Low';
  }
  return 'Medium';
}

// Recursively scan directory
function scanDirectory(dir, todos = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules, dist, build directories
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', '.husky'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, todos);
    } else if (entry.isFile()) {
      // Only scan TypeScript and JavaScript files
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ||
          entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const fileTodos = scanFile(fullPath);
        todos.push(...fileTodos);
      }
    }
  }

  return todos;
}

// Create task in Notion
async function createTodoTask(todo) {
  const relativePath = path.relative(process.cwd(), todo.file).replace(/\\/g, '/');
  const taskTitle = `${todo.text.substring(0, 80)}${todo.text.length > 80 ? '...' : ''}`;

  const properties = {
    'Name': titleProperty(taskTitle),
    'Type': selectProperty(todo.type),
    'Priority': selectProperty(todo.priority),
    'Status': selectProperty('Not Started'),
    'Related Files': multiSelectProperty([path.basename(todo.file)]),
    'Commit Hash': { rich_text: [{ text: { content: `${relativePath}:${todo.line}` } }] }
  };

  // Add description as child content
  const children = [
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: `Found in: ${relativePath}:${todo.line}` } }]
      }
    },
    {
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ text: { content: todo.text } }],
        language: 'plain text'
      }
    }
  ];

  return safeExecute(
    () => createDatabasePage(config.databases.tasks, properties, children),
    `Failed to create TODO task: ${taskTitle}`
  );
}

// Check if task already exists
async function taskExists(todoText) {
  try {
    const response = await queryDatabase(
      config.databases.tasks,
      {
        property: 'Name',
        title: {
          contains: todoText.substring(0, 50)
        }
      }
    );

    return response && response.results.length > 0;
  } catch (error) {
    logger.debug(`Error checking for existing task: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🔍 TODO/FIXME Scanner');
    console.log('═══════════════════════════════════════════════════════\n');

    // Validate config
    config.validate(['tasks']);

    const srcDir = path.join(__dirname, '../../src');
    console.log('Scanning:', srcDir);

    const todos = scanDirectory(srcDir);
    logger.info(`Found ${todos.length} TODO/FIXME comments\n`);

    if (todos.length === 0) {
      logger.success('No TODOs found - codebase is clean!');
      return;
    }

    // Group by type
    const byType = {};
    todos.forEach(todo => {
      byType[todo.type] = (byType[todo.type] || 0) + 1;
    });

    console.log('Breakdown by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('');

    // Create tasks in Notion
    let created = 0;
    let skipped = 0;

    for (const todo of todos) {
      // Check if already exists (simple deduplication)
      const exists = await taskExists(todo.text);
      if (exists) {
        skipped++;
        continue;
      }

      const result = await createTodoTask(todo);
      if (result) {
        created++;
        logger.info(`✓ Created: ${todo.text.substring(0, 60)}...`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    logger.success(`TODO sync complete: ${created} created, ${skipped} skipped`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    logger.error('Error during TODO scan:');
    logger.error(error.message);
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, createTodoTask };
