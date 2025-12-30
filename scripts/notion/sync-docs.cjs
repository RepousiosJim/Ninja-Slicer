#!/usr/bin/env node

// Sync Documentation to Notion
// Syncs markdown documentation files to Notion Documentation Hub

const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');
const {
  createDatabasePage,
  queryDatabase,
  appendBlocks,
  titleProperty,
  selectProperty,
  dateProperty,
  numberProperty,
  safeExecute,
  logger
} = require('./utils.cjs');
const { markdownToBlocks, chunkBlocks } = require('./markdown-parser.cjs');

// Documentation files to sync
const DOCS_TO_SYNC = [
  { file: 'README.md', type: 'Reference', title: 'Project Overview' },
  { file: 'GAME_SPEC.md', type: 'Spec', title: 'Game Specification' },
  { file: 'ARCHITECTURE.md', type: 'Architecture', title: 'Technical Architecture' },
  { file: 'DEVELOPMENT_PLAN.md', type: 'Plan', title: 'Development Plan' },
  { file: 'QUICK_REFERENCE.md', type: 'Reference', title: 'Quick Reference' },
  { file: 'ASSET_REQUIREMENTS.md', type: 'Guide', title: 'Asset Requirements' },
  { file: 'BALANCE_GUIDE.md', type: 'Guide', title: 'Balance Guide' },
  { file: 'PERFORMANCE_GUIDE.md', type: 'Guide', title: 'Performance Guide' },
  { file: 'THEME_IMPLEMENTATION_SUMMARY.md', type: 'Guide', title: 'Theme Implementation Summary' }
];

// Get project root directory
function getProjectRoot() {
  return path.resolve(__dirname, '../..');
}

// Read markdown file
function readMarkdownFile(filePath) {
  try {
    const fullPath = path.join(getProjectRoot(), filePath);
    if (!fs.existsSync(fullPath)) {
      logger.warning(`File not found: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const wordCount = content.split(/\s+/).length;

    return {
      content,
      wordCount,
      exists: true
    };
  } catch (error) {
    logger.error(`Error reading file ${filePath}: ${error.message}`);
    return null;
  }
}

// Find existing doc page in Notion
async function findDocPage(title) {
  try {
    const response = await queryDatabase(
      config.databases.docs,
      {
        property: 'Title',
        title: {
          equals: title
        }
      }
    );

    return response && response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    logger.error(`Error finding doc page "${title}": ${error.message}`);
    return null;
  }
}

// Delete all blocks from a page (to update it)
async function clearPageContent(pageId) {
  try {
    const { getNotionClient } = require('./utils.cjs');
    const notion = getNotionClient();

    // Get all blocks
    const response = await notion.blocks.children.list({ block_id: pageId });

    // Delete each block
    for (const block of response.results) {
      await notion.blocks.delete({ block_id: block.id });
    }

    logger.debug(`  Cleared existing content from page`);
    return true;
  } catch (error) {
    logger.error(`Error clearing page content: ${error.message}`);
    return false;
  }
}

// Create or update documentation page
async function syncDocPage(docInfo) {
  logger.info(`\nSyncing: ${docInfo.title}`);
  logger.debug(`  File: ${docInfo.file}`);
  logger.debug(`  Type: ${docInfo.type}`);

  // Read the markdown file
  const fileData = readMarkdownFile(docInfo.file);
  if (!fileData) {
    logger.warning(`  Skipping ${docInfo.title} - file not found`);
    return false;
  }

  logger.debug(`  Word count: ${fileData.wordCount}`);

  // Convert markdown to Notion blocks
  let blocks;
  try {
    blocks = markdownToBlocks(fileData.content);
    logger.debug(`  Converted to ${blocks.length} Notion blocks`);
  } catch (error) {
    logger.error(`  Failed to parse markdown: ${error.message}`);
    return false;
  }

  // Check if page already exists
  const existingPage = await findDocPage(docInfo.title);

  if (existingPage) {
    logger.info(`  Updating existing page...`);

    // Update page properties
    const updateResult = await safeExecute(
      async () => {
        const { updatePage } = require('./utils.cjs');
        return updatePage(existingPage.id, {
          'Last Synced': dateProperty(new Date().toISOString()),
          'Status': selectProperty('Current'),
          'Word Count': numberProperty(fileData.wordCount)
        });
      },
      'Failed to update page properties'
    );

    if (!updateResult) return false;

    // Clear existing content
    await clearPageContent(existingPage.id);

    // Add new content in chunks
    const blockChunks = chunkBlocks(blocks, 100);
    for (let i = 0; i < blockChunks.length; i++) {
      logger.debug(`  Uploading chunk ${i + 1}/${blockChunks.length}`);
      const result = await safeExecute(
        () => appendBlocks(existingPage.id, blockChunks[i]),
        `Failed to append blocks (chunk ${i + 1})`
      );

      if (!result) return false;
    }

    logger.success(`✓ Updated: ${docInfo.title}`);
    return true;

  } else {
    logger.info(`  Creating new page...`);

    // Create new page with properties
    const properties = {
      'Title': titleProperty(docInfo.title),
      'Doc Type': selectProperty(docInfo.type),
      'Source File': { rich_text: [{ text: { content: docInfo.file } }] },
      'Last Synced': dateProperty(new Date().toISOString()),
      'Status': selectProperty('Current'),
      'Word Count': numberProperty(fileData.wordCount)
    };

    // Notion allows up to 100 blocks in initial creation
    // If more, create page first, then append
    const initialBlocks = blocks.slice(0, 100);
    const remainingBlocks = blocks.slice(100);

    const pageResult = await safeExecute(
      () => createDatabasePage(config.databases.docs, properties, initialBlocks),
      'Failed to create documentation page'
    );

    if (!pageResult) return false;

    // Append remaining blocks if any
    if (remainingBlocks.length > 0) {
      const blockChunks = chunkBlocks(remainingBlocks, 100);
      for (let i = 0; i < blockChunks.length; i++) {
        logger.debug(`  Uploading additional chunk ${i + 1}/${blockChunks.length}`);
        const result = await safeExecute(
          () => appendBlocks(pageResult.id, blockChunks[i]),
          `Failed to append blocks (chunk ${i + 1})`
        );

        if (!result) return false;
      }
    }

    logger.success(`✓ Created: ${docInfo.title}`);
    return true;
  }
}

// Main execution
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  📚 Notion Documentation Sync');
    console.log('═══════════════════════════════════════════════════════\n');

    // Validate configuration
    config.validate();

    let successCount = 0;
    let failCount = 0;

    // Sync each document
    for (const docInfo of DOCS_TO_SYNC) {
      const success = await syncDocPage(docInfo);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    logger.success(`Sync complete: ${successCount} succeeded, ${failCount} failed`);
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    if (error.message && error.message.includes('Missing required environment variables')) {
      logger.error('Notion integration not configured');
      logger.info('Add NOTION_API_KEY and database IDs to .env to enable sync');
    } else {
      logger.error('Unexpected error during documentation sync:');
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

module.exports = { syncDocPage, DOCS_TO_SYNC };
