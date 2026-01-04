// Linear MCP Server
// Model Context Protocol server for Linear issue management

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const config = require('./config.cjs');
const {
  createIssue,
  getIssues,
  getIssue,
  updateIssueStatus,
  addComment,
  getWorkflowStates,
  getLabels,
  searchIssues,
  logger
} = require('./utils.cjs');

// Create MCP server instance
const server = new McpServer({
  name: 'linear-mcp-server',
  version: '1.0.0'
});

// Helper to format issue for display
function formatIssue(issue) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description?.substring(0, 200) || '',
    state: issue.state?.name || 'Unknown',
    priority: getPriorityName(issue.priority),
    labels: issue.labels?.nodes?.map(l => l.name) || [],
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt
  };
}

// Helper to format full issue details
function formatIssueFull(issue) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description || '',
    state: issue.state?.name || 'Unknown',
    stateType: issue.state?.type || 'Unknown',
    priority: getPriorityName(issue.priority),
    priorityLabel: issue.priorityLabel,
    labels: issue.labels?.nodes?.map(l => ({ id: l.id, name: l.name, color: l.color })) || [],
    assignee: issue.assignee ? {
      id: issue.assignee.id,
      name: issue.assignee.name,
      email: issue.assignee.email
    } : null,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    completedAt: issue.completedAt,
    url: issue.url
  };
}

// Helper to convert priority number to name
function getPriorityName(priority) {
  const names = {
    0: 'No Priority',
    1: 'Urgent',
    2: 'High',
    3: 'Medium',
    4: 'Low'
  };
  return names[priority] || 'Unknown';
}

// Register tools
// Tool: get_issues - Retrieve issues with optional filters
server.registerTool(
  'get_issues',
  {
    title: 'Get Issues',
    description: 'Retrieve issues from Linear with optional filters',
    inputSchema: {
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (e.g., backlog, in_progress, done)'
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by label names'
        },
        priority: {
          type: 'string',
          enum: ['urgent', 'high', 'medium', 'low', 'noPriority'],
          description: 'Filter by priority level'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of issues to return (default: 20)'
        }
      },
      type: 'object'
    }
  },
  async ({ status, labels, priority, limit = 20 }) => {
    try {
      const filters = {};
      
      if (labels && labels.length > 0) {
        // Get issues by labels
        let allIssues = [];
        for (const label of labels) {
          const issues = await getIssues();
          const filtered = issues.filter(issue => 
            issue.labels?.nodes?.some(l => 
              l.name.toLowerCase() === label.toLowerCase()
            )
          );
          allIssues = allIssues.concat(filtered);
        }
        // Remove duplicates
        const uniqueIssues = [...new Map(allIssues.map(i => [i.id, i])).values()];
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              issues: uniqueIssues.slice(0, limit).map(formatIssue),
              total: uniqueIssues.length
            }, null, 2)
          }]
        };
      }
      
      if (status) {
        filters.state = { name: { eq: status } };
      }
      
      if (priority) {
        filters.priority = { eq: config.getPriority(priority) };
      }

      const issues = await getIssues(filters);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: issues.slice(0, limit).map(formatIssue),
            total: issues.length
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: create_issue - Create a new issue
server.registerTool(
  'create_issue',
  {
    title: 'Create Issue',
    description: 'Create a new issue in Linear',
    inputSchema: {
      properties: {
        title: {
          type: 'string',
          description: 'The title of the issue'
        },
        description: {
          type: 'string',
          description: 'The description/body of the issue (Markdown supported)'
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Label names to apply (e.g., bug, feature, enhancement)'
        },
        priority: {
          type: 'string',
          enum: ['urgent', 'high', 'medium', 'low'],
          description: 'Priority level (default: medium)'
        }
      },
      required: ['title'],
      type: 'object'
    }
  },
  async ({ title, description = '', labels = [], priority = 'medium' }) => {
    try {
      const issue = await createIssue(title, description, labels, priority);
      logger.success(`Created issue: ${issue.identifier}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: formatIssue(issue)
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: update_issue_status - Update issue status
server.registerTool(
  'update_issue_status',
  {
    title: 'Update Issue Status',
    description: 'Update the status/workflow state of an issue',
    inputSchema: {
      properties: {
        issueId: {
          type: 'string',
          description: 'The Linear issue ID (e.g., PROJ-123)'
        },
        status: {
          type: 'string',
          description: 'The new status/state name (e.g., backlog, in_progress, done)'
        }
      },
      required: ['issueId', 'status'],
      type: 'object'
    }
  },
  async ({ issueId, status }) => {
    try {
      // First get workflow states to find the state ID
      const states = await getWorkflowStates();
      const targetState = states.find(
        s => s.name.toLowerCase() === status.toLowerCase()
      );
      
      if (!targetState) {
        throw new Error(`Status "${status}" not found. Available: ${states.map(s => s.name).join(', ')}`);
      }
      
      const issue = await updateIssueStatus(issueId, targetState.id);
      logger.success(`Updated issue ${issueId} to status: ${status}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            issue: formatIssue(issue),
            newStatus: targetState.name
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: add_issue_comment - Add comment to issue
server.registerTool(
  'add_issue_comment',
  {
    title: 'Add Comment',
    description: 'Add a comment to an existing issue',
    inputSchema: {
      properties: {
        issueId: {
          type: 'string',
          description: 'The Linear issue ID (e.g., PROJ-123)'
        },
        body: {
          type: 'string',
          description: 'The comment text (Markdown supported)'
        }
      },
      required: ['issueId', 'body'],
      type: 'object'
    }
  },
  async ({ issueId, body }) => {
    try {
      const comment = await addComment(issueId, body);
      logger.success(`Added comment to issue: ${issueId}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            commentId: comment.id,
            createdAt: comment.createdAt
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: get_workflow_states - Get all workflow states
server.registerTool(
  'get_workflow_states',
  {
    title: 'Get Workflow States',
    description: 'Get all workflow states for the team',
    inputSchema: {
      properties: {},
      type: 'object'
    }
  },
  async () => {
    try {
      const states = await getWorkflowStates();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            states: states.map(s => ({
              id: s.id,
              name: s.name,
              type: s.type
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: get_labels - Get all labels
server.registerTool(
  'get_labels',
  {
    title: 'Get Labels',
    description: 'Get all labels available in the team',
    inputSchema: {
      properties: {},
      type: 'object'
    }
  },
  async () => {
    try {
      const labels = await getLabels();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            labels: labels.map(l => ({
              id: l.id,
              name: l.name,
              color: l.color
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: search_issues - Search issues
server.registerTool(
  'search_issues',
  {
    title: 'Search Issues',
    description: 'Search issues by title or description content',
    inputSchema: {
      properties: {
        query: {
          type: 'string',
          description: 'Search query string'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)'
        }
      },
      required: ['query'],
      type: 'object'
    }
  },
  async ({ query, limit = 10 }) => {
    try {
      const issues = await searchIssues(query);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            issues: issues.slice(0, limit).map(formatIssue),
            total: issues.length
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool: get_issue_details - Get issue details
server.registerTool(
  'get_issue_details',
  {
    title: 'Get Issue Details',
    description: 'Get detailed information about a specific issue',
    inputSchema: {
      properties: {
        issueId: {
          type: 'string',
          description: 'The Linear issue ID (e.g., PROJ-123)'
        }
      },
      required: ['issueId'],
      type: 'object'
    }
  },
  async ({ issueId }) => {
    try {
      const issue = await getIssue(issueId);
      
      if (!issue) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Issue not found' }, null, 2)
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            issue: formatIssueFull(issue)
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  try {
    config.validate();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.success('Linear MCP Server started');
    console.log('Available tools: get_issues, create_issue, update_issue_status, add_issue_comment, get_workflow_states, get_labels, search_issues, get_issue_details');
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Export for testing and programmatic use
module.exports = {
  server,
  main
};

// Run if executed directly
if (require.main === module) {
  main();
}
