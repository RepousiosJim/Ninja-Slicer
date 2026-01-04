// Linear Integration Utilities
// Provides API client, rate limiting, and helper functions

const { LinearClient } = require('@linear/sdk');
const config = require('./config.cjs');

// Initialize Linear client
let linearClient = null;

function getLinearClient() {
  if (!linearClient) {
    config.validate();
    linearClient = new LinearClient({
      apiKey: config.apiKey
    });
  }
  return linearClient;
}

// Rate Limiter - Linear API limit: ~1000 requests/hour for authenticated users
class RateLimiter {
  constructor(requestsPerSecond = 5) {
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

// Helper: Create an issue
async function createIssue(title, description, labels = [], priority = 'medium') {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const labelIds = [];
    if (labels.length > 0) {
      // Get label IDs from label names
      const allLabels = await linear.labels();
      for (const label of labels) {
        const found = allLabels.nodes.find(
          l => l.name.toLowerCase() === label.toLowerCase()
        );
        if (found) {
          labelIds.push(found.id);
        }
      }
    }

    const issueCreateInput = {
      title,
      description,
      teamId: config.teamId,
      priority: config.getPriority(priority),
      labelIds
    };

    const issue = await linear.createIssue(issueCreateInput);
    return issue.issue;
  });
}

// Helper: Get issues with optional filters
async function getIssues(filters = {}) {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const queryFilters = {
      teamId: { eq: config.teamId },
      ...filters
    };

    const issues = await linear.issues(queryFilters);
    return issues.nodes;
  });
}

// Helper: Get issue by ID
async function getIssue(issueId) {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    return await linear.issue(issueId);
  });
}

// Helper: Update issue status
async function updateIssueStatus(issueId, stateId) {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const issue = await linear.updateIssue(issueId, {
      stateId
    });
    
    return issue.issue;
  });
}

// Helper: Add comment to issue
async function addComment(issueId, body) {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const comment = await linear.createComment({
      issueId,
      body
    });
    
    return comment.comment;
  });
}

// Helper: Get workflow states for the team
async function getWorkflowStates() {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const team = await linear.team(config.teamId);
    const states = await team.states();
    return states.nodes;
  });
}

// Helper: Get all labels for the team
async function getLabels() {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const labels = await linear.labels({
      teamId: { eq: config.teamId }
    });
    return labels.nodes;
  });
}

// Helper: Search issues
async function searchIssues(query) {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    const issues = await linear.issues({
      or: [
        { title: { contains: query } },
        { description: { contains: query } }
      ],
      teamId: { eq: config.teamId }
    });
    
    return issues.nodes;
  });
}

// Helper: Get issues by label
async function getIssuesByLabel(labelName) {
  return rateLimiter.execute(async () => {
    const linear = getLinearClient();
    
    // First get the label ID
    const labels = await getLabels();
    const label = labels.find(
      l => l.name.toLowerCase() === labelName.toLowerCase()
    );
    
    if (!label) {
      return [];
    }
    
    const issues = await linear.issues({
      labelId: { eq: label.id },
      teamId: { eq: config.teamId }
    });
    
    return issues.nodes;
  });
}

// Error handling wrapper
async function safeExecute(fn, errorMessage = 'Linear API error') {
  try {
    return await fn();
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('❌ Network error: Unable to connect to Linear API');
      console.error('   Please check your internet connection');
      return null;
    }

    if (error.status === 401 || error.status === 403) {
      console.error('❌ Authentication error: Invalid LINEAR_API_KEY');
      console.error('   Please check your .env file');
      return null;
    }

    if (error.status === 404) {
      console.error('❌ Not found: Issue or resource does not exist');
      console.error('   Please verify the issue ID');
      return null;
    }

    if (error.status === 429) {
      console.error('❌ Rate limit exceeded');
      console.error('   Too many requests. Please try again later.');
      return null;
    }

    console.error(`❌ ${errorMessage}:`, error.message);
    if (error.response?.errors) {
      console.error('   Details:', JSON.stringify(error.response.errors, null, 2));
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
  getLinearClient,
  rateLimiter,
  createIssue,
  getIssues,
  getIssue,
  updateIssueStatus,
  addComment,
  getWorkflowStates,
  getLabels,
  searchIssues,
  getIssuesByLabel,
  safeExecute,
  logger
};
