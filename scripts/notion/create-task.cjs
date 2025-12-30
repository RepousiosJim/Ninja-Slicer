#!/usr/bin/env node

// Create Task in Notion
// Interactive CLI tool for creating tasks in Notion Tasks & Features database

const inquirer = require('inquirer');
const config = require('./config.cjs');
const {
  createDatabasePage,
  queryDatabase,
  titleProperty,
  selectProperty,
  dateProperty,
  numberProperty,
  safeExecute,
  logger
} = require('./utils.cjs');

// Get next available task ID
async function getNextTaskId() {
  try {
    const response = await queryDatabase(
      config.databases.tasks,
      {},
      [{ property: 'Name', direction: 'descending' }]
    );

    if (!response || response.results.length === 0) {
      return 1;
    }

    // Extract task IDs from titles (format: "T-123: Task name")
    const taskIds = response.results
      .map(page => {
        const title = page.properties.Name?.title?.[0]?.text?.content || '';
        const match = title.match(/^T-(\d+):/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(id => id > 0);

    return taskIds.length > 0 ? Math.max(...taskIds) + 1 : 1;
  } catch (error) {
    logger.error('Error getting next task ID:', error.message);
    return 1;
  }
}

// Prompt user for task details
async function promptTaskDetails() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✨ Create New Task in Notion');
  console.log('═══════════════════════════════════════════════════════\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Task name:',
      validate: (input) => input.trim().length > 0 || 'Task name is required'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Task type:',
      choices: ['Feature', 'Bug', 'Asset', 'Testing', 'Documentation', 'Refactor'],
      default: 'Feature'
    },
    {
      type: 'list',
      name: 'priority',
      message: 'Priority:',
      choices: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium'
    },
    {
      type: 'list',
      name: 'status',
      message: 'Status:',
      choices: ['Not Started', 'In Progress', 'In Review', 'Completed', 'Blocked'],
      default: 'Not Started'
    },
    {
      type: 'input',
      name: 'dueDate',
      message: 'Due date (YYYY-MM-DD, or leave empty):',
      validate: (input) => {
        if (!input.trim()) return true;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input)) {
          return 'Invalid date format. Use YYYY-MM-DD';
        }
        const date = new Date(input);
        if (isNaN(date.getTime())) {
          return 'Invalid date';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):'
    }
  ]);

  return answers;
}

// Create task in Notion
async function createTask(taskDetails, taskId) {
  const taskTitle = `T-${taskId}: ${taskDetails.name}`;

  logger.info(`\nCreating task: ${taskTitle}`);
  logger.debug(`  Type: ${taskDetails.type}`);
  logger.debug(`  Priority: ${taskDetails.priority}`);
  logger.debug(`  Status: ${taskDetails.status}`);

  const properties = {
    'Name': titleProperty(taskTitle),
    'Type': selectProperty(taskDetails.type),
    'Priority': selectProperty(taskDetails.priority),
    'Status': selectProperty(taskDetails.status),
    'Progress': numberProperty(taskDetails.status === 'Completed' ? 100 : 0),
    'Last Updated': dateProperty(new Date().toISOString())
  };

  // Add due date if provided
  if (taskDetails.dueDate && taskDetails.dueDate.trim()) {
    properties['Due Date'] = dateProperty(taskDetails.dueDate);
  }

  // Add description as page content if provided
  const children = [];
  if (taskDetails.description && taskDetails.description.trim()) {
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: taskDetails.description } }]
      }
    });
  }

  const result = await safeExecute(
    () => createDatabasePage(config.databases.tasks, properties, children),
    'Failed to create task in Notion'
  );

  if (result) {
    console.log('\n═══════════════════════════════════════════════════════');
    logger.success(`✓ Task created successfully!`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n  Task ID: T-${taskId}`);
    console.log(`  Title: ${taskDetails.name}`);
    console.log(`  Type: ${taskDetails.type}`);
    console.log(`  Priority: ${taskDetails.priority}`);
    console.log(`  Status: ${taskDetails.status}`);
    if (taskDetails.dueDate) {
      console.log(`  Due: ${taskDetails.dueDate}`);
    }
    console.log('\n  💡 Reference this task in commits:');
    console.log(`     git commit -m "feat: your changes #T-${taskId}"\n`);
    return true;
  } else {
    logger.error('Failed to create task');
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Validate configuration
    config.validate();

    // Get next task ID
    const taskId = await getNextTaskId();

    // Prompt for task details
    const taskDetails = await promptTaskDetails();

    // Create task in Notion
    const success = await createTask(taskDetails, taskId);

    process.exit(success ? 0 : 1);

  } catch (error) {
    if (error.message && error.message.includes('Missing required environment variables')) {
      logger.error('\nNotion integration not configured');
      logger.info('Add NOTION_API_KEY and database IDs to .env to enable task creation\n');
    } else if (error.isTtyError) {
      logger.error('\nCould not render prompt in this environment');
    } else {
      logger.error('\nUnexpected error:');
      logger.error(error.message);
      if (error.stack) {
        logger.debug(error.stack);
      }
    }

    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createTask, getNextTaskId };
