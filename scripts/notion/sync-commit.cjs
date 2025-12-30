#!/usr/bin/env node

// Sync Git Commit to Notion
// Automatically creates a commit log entry in Notion after each git commit

const { execSync } = require('child_process');
const config = require('./config.cjs');
const {
  createDatabasePage,
  queryDatabase,
  titleProperty,
  selectProperty,
  multiSelectProperty,
  dateProperty,
  relationProperty,
  safeExecute,
  logger
} = require('./utils.cjs');

// Get latest commit information
function getCommitInfo() {
  try {
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    const message = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
    const author = execSync('git log -1 --pretty=%an', { encoding: 'utf-8' }).trim();
    const authorEmail = execSync('git log -1 --pretty=%ae', { encoding: 'utf-8' }).trim();
    const timestamp = execSync('git log -1 --pretty=%aI', { encoding: 'utf-8' }).trim();
    const filesChanged = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(f => f);

    return {
      hash,
      shortHash,
      message,
      author,
      authorEmail,
      timestamp,
      filesChanged
    };
  } catch (error) {
    logger.error('Failed to get commit information');
    logger.error(error.message);
    return null;
  }
}

// Parse commit type from message (conventional commits)
function parseCommitType(message) {
  const match = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+?\))?:/i);

  if (match) {
    return match[1].toLowerCase();
  }

  // Fallback - detect by keywords
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) return 'fix';
  if (lowerMessage.includes('feat') || lowerMessage.includes('add')) return 'feat';
  if (lowerMessage.includes('doc')) return 'docs';
  if (lowerMessage.includes('refactor')) return 'refactor';
  if (lowerMessage.includes('test')) return 'test';
  if (lowerMessage.includes('style')) return 'style';

  return 'chore';
}

// Extract task references from commit message (#T-123)
function extractTaskReferences(message) {
  const matches = message.match(/#T-(\d+)/g);
  if (!matches) return [];

  return matches.map(match => match.replace('#T-', ''));
}

// Find task pages by ID
async function findTaskPages(taskIds) {
  const pageIds = [];

  for (const taskId of taskIds) {
    try {
      const response = await queryDatabase(
        config.databases.tasks,
        {
          property: 'Name',
          title: {
            contains: `T-${taskId}`
          }
        }
      );

      if (response && response.results.length > 0) {
        pageIds.push(response.results[0].id);
        logger.debug(`Found task T-${taskId}`);
      } else {
        logger.warning(`Task T-${taskId} not found in Notion`);
      }
    } catch (error) {
      logger.error(`Error finding task T-${taskId}: ${error.message}`);
    }
  }

  return pageIds;
}

// Create commit entry in Notion
async function createCommitEntry(commitInfo) {
  const commitType = parseCommitType(commitInfo.message);
  const taskIds = extractTaskReferences(commitInfo.message);

  logger.info(`Syncing commit ${commitInfo.shortHash} to Notion...`);
  logger.debug(`  Type: ${commitType}`);
  logger.debug(`  Message: ${commitInfo.message}`);
  logger.debug(`  Files changed: ${commitInfo.filesChanged.length}`);

  // Find related task pages if any task references exist
  let relatedTaskPageIds = [];
  if (taskIds.length > 0) {
    logger.info(`  Found task references: ${taskIds.map(id => `T-${id}`).join(', ')}`);
    relatedTaskPageIds = await findTaskPages(taskIds);
  }

  const properties = {
    'Name': titleProperty(`${commitInfo.shortHash}: ${commitInfo.message.substring(0, 100)}`),
    'Hash': { rich_text: [{ text: { content: commitInfo.hash } }] },
    'Author': { rich_text: [{ text: { content: `${commitInfo.author} <${commitInfo.authorEmail}>` } }] },
    'Timestamp': dateProperty(commitInfo.timestamp),
    'Files Changed': multiSelectProperty(commitInfo.filesChanged.slice(0, 20)), // Limit to 20 files
    'Commit Type': selectProperty(commitType)
  };

  // Add relation to tasks if found
  if (relatedTaskPageIds.length > 0) {
    properties['Related Tasks'] = relationProperty(relatedTaskPageIds);
  }

  const result = await safeExecute(
    () => createDatabasePage(config.databases.commits, properties),
    'Failed to create commit entry in Notion'
  );

  if (result) {
    logger.success(`✓ Commit ${commitInfo.shortHash} synced to Notion`);
    if (relatedTaskPageIds.length > 0) {
      logger.success(`✓ Linked to ${relatedTaskPageIds.length} task(s)`);
    }
    return true;
  } else {
    logger.warning('Commit sync failed - continuing without blocking');
    return false;
  }
}

// Main execution
async function main() {
  try {
    // Validate configuration
    config.validate();

    // Get commit info
    const commitInfo = getCommitInfo();
    if (!commitInfo) {
      logger.error('Could not retrieve commit information');
      process.exit(0); // Don't block the commit
    }

    // Create Notion entry
    await createCommitEntry(commitInfo);

  } catch (error) {
    if (error.message && error.message.includes('Missing required environment variables')) {
      logger.warning('Notion integration not configured');
      logger.info('Add NOTION_API_KEY and database IDs to .env to enable sync');
    } else {
      logger.error('Unexpected error during commit sync:');
      logger.error(error.message);
    }

    // Never block commits - just warn
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { getCommitInfo, parseCommitType, createCommitEntry };
