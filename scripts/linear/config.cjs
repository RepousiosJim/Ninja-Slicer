// Linear Integration Configuration
// Loads Linear API credentials and team settings from environment variables

require('dotenv').config();

const config = {
  // Linear API authentication
  apiKey: process.env.LINEAR_API_KEY,
  
  // Team and workflow identifiers
  teamId: process.env.LINEAR_TEAM_ID,
  workflowStateId: process.env.LINEAR_WORKFLOW_STATE_ID,
  
  // Label mappings for issue types
  labels: {
    bug: process.env.LINEAR_LABEL_BUG || 'bug',
    feature: process.env.LINEAR_LABEL_FEATURE || 'feature',
    enhancement: process.env.LINEAR_LABEL_ENHANCEMENT || 'enhancement',
    task: process.env.LINEAR_LABEL_TASK || 'task',
    question: process.env.LINEAR_LABEL_QUESTION || 'question',
    documentation: process.env.LINEAR_LABEL_DOCUMENTATION || 'documentation'
  },
  
  // Priority mappings
  priorities: {
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
    noPriority: 0
  },

  // Validation helper
  validate(requiredFields = []) {
    const missing = [];

    if (!this.apiKey) {
      missing.push('LINEAR_API_KEY');
    }

    if (!this.teamId) {
      missing.push('LINEAR_TEAM_ID');
    }

    // Check for any additional required fields
    requiredFields.forEach(field => {
      if (!this[field]) {
        missing.push(`LINEAR_${field.toUpperCase()}`);
      }
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
        `Please add these to your .env file. See .env.example for details.`
      );
    }

    return true;
  },

  // Get label IDs by name
  getLabelId(labelName) {
    return this.labels[labelName] || null;
  },

  // Get priority number by name
  getPriority(priorityName) {
    return this.priorities[priorityName] || this.priorities.medium;
  }
};

module.exports = config;
