// Notion Integration Configuration
// Loads Notion API credentials and database IDs from environment variables

require('dotenv').config();

const config = {
  // Notion API authentication
  notionApiKey: process.env.NOTION_API_KEY,

  // Database IDs for different tracking purposes
  databases: {
    tasks: process.env.NOTION_DB_TASKS,        // Tasks & Features database
    docs: process.env.NOTION_DB_DOCS,          // Documentation Hub database
    assets: process.env.NOTION_DB_ASSETS,      // Asset Tracker database
    commits: process.env.NOTION_DB_COMMITS,    // Commit Log database
    levels: process.env.NOTION_DB_LEVELS,      // Levels & Bosses database
    weapons: process.env.NOTION_DB_WEAPONS,    // Weapons & Upgrades database
    systems: process.env.NOTION_DB_SYSTEMS,    // Systems Status database
    scenes: process.env.NOTION_DB_SCENES,      // Scenes Status database
    milestones: process.env.NOTION_DB_MILESTONES  // Development Milestones database
  },

  // Validation helper
  validate(requiredDbs = []) {
    const missing = [];

    if (!this.notionApiKey) missing.push('NOTION_API_KEY');

    // If specific databases are required, only check those
    if (requiredDbs.length > 0) {
      requiredDbs.forEach(db => {
        if (!this.databases[db]) missing.push(`NOTION_DB_${db.toUpperCase()}`);
      });
    } else {
      // Otherwise check the core databases
      if (!this.databases.tasks) missing.push('NOTION_DB_TASKS');
      if (!this.databases.docs) missing.push('NOTION_DB_DOCS');
      if (!this.databases.assets) missing.push('NOTION_DB_ASSETS');
      if (!this.databases.commits) missing.push('NOTION_DB_COMMITS');
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
        `Please add these to your .env file. See .env.example for details.`
      );
    }

    return true;
  }
};

module.exports = config;
