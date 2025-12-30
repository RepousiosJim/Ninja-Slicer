// Notion Integration Utilities
// Provides API client, rate limiting, and helper functions

const { Client } = require('@notionhq/client');
const config = require('./config.cjs');

// Initialize Notion client
let notionClient = null;

function getNotionClient() {
  if (!notionClient) {
    config.validate();
    notionClient = new Client({ auth: config.notionApiKey });
  }
  return notionClient;
}

// Rate Limiter - Notion API limit: 3 requests/second
class RateLimiter {
  constructor(requestsPerSecond = 3) {
    this.requestsPerSecond = requestsPerSecond;
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const minInterval = 1000 / this.requestsPerSecond;

      if (timeSinceLastRequest < minInterval) {
        await this.sleep(minInterval - timeSinceLastRequest);
      }

      const { fn, resolve, reject } = this.queue.shift();
      this.lastRequestTime = Date.now();

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const rateLimiter = new RateLimiter();

// Helper: Create a page in a database
async function createDatabasePage(databaseId, properties, children = []) {
  return rateLimiter.execute(async () => {
    const notion = getNotionClient();
    return notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      children
    });
  });
}

// Helper: Update a page
async function updatePage(pageId, properties) {
  return rateLimiter.execute(async () => {
    const notion = getNotionClient();
    return notion.pages.update({
      page_id: pageId,
      properties
    });
  });
}

// Helper: Query a database
async function queryDatabase(databaseId, filter = {}, sorts = []) {
  return rateLimiter.execute(async () => {
    const notion = getNotionClient();
    return notion.databases.query({
      database_id: databaseId,
      filter,
      sorts
    });
  });
}

// Helper: Append blocks to a page
async function appendBlocks(pageId, children) {
  return rateLimiter.execute(async () => {
    const notion = getNotionClient();
    return notion.blocks.children.append({
      block_id: pageId,
      children
    });
  });
}

// Helper: Create a new page (not in database)
async function createPage(parentPageId, title, children = []) {
  return rateLimiter.execute(async () => {
    const notion = getNotionClient();
    return notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        }
      },
      children
    });
  });
}

// Helper: Find page by title in database
async function findPageByTitle(databaseId, title) {
  const response = await queryDatabase(databaseId, {
    property: 'Name',
    title: {
      equals: title
    }
  });

  return response.results.length > 0 ? response.results[0] : null;
}

// Helper: Format rich text for Notion
function richText(text, annotations = {}) {
  return {
    type: 'text',
    text: { content: text },
    annotations
  };
}

// Helper: Create select property
function selectProperty(value) {
  return value ? { select: { name: value } } : { select: null };
}

// Helper: Create multi-select property
function multiSelectProperty(values) {
  return {
    multi_select: values.map(value => ({ name: value }))
  };
}

// Helper: Create date property
function dateProperty(dateString) {
  return dateString ? { date: { start: dateString } } : { date: null };
}

// Helper: Create number property
function numberProperty(num) {
  return { number: num };
}

// Helper: Create title property
function titleProperty(text) {
  return {
    title: [{ text: { content: text } }]
  };
}

// Helper: Create relation property
function relationProperty(pageIds) {
  return {
    relation: Array.isArray(pageIds)
      ? pageIds.map(id => ({ id }))
      : [{ id: pageIds }]
  };
}

// Error handling wrapper
async function safeExecute(fn, errorMessage = 'Notion API error') {
  try {
    return await fn();
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('❌ Network error: Unable to connect to Notion API');
      console.error('   Please check your internet connection');
      return null;
    }

    if (error.status === 401) {
      console.error('❌ Authentication error: Invalid NOTION_API_KEY');
      console.error('   Please check your .env file');
      return null;
    }

    if (error.status === 404) {
      console.error('❌ Not found: Database or page does not exist');
      console.error('   Please verify your database IDs in .env');
      return null;
    }

    if (error.status === 429) {
      console.error('❌ Rate limit exceeded');
      console.error('   Too many requests. Please try again later.');
      return null;
    }

    console.error(`❌ ${errorMessage}:`, error.message);
    if (error.body) {
      console.error('   Details:', JSON.stringify(error.body, null, 2));
    }
    return null;
  }
}

// Logger utility
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warning: (msg) => console.warn(`⚠️  ${msg}`),
  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log(`🐛 ${msg}`);
    }
  }
};

module.exports = {
  getNotionClient,
  rateLimiter,
  createDatabasePage,
  updatePage,
  queryDatabase,
  appendBlocks,
  createPage,
  findPageByTitle,
  richText,
  selectProperty,
  multiSelectProperty,
  dateProperty,
  numberProperty,
  titleProperty,
  relationProperty,
  safeExecute,
  logger
};
