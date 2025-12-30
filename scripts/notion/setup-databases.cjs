#!/usr/bin/env node

// Setup Notion Databases
// Creates all required databases for the Ninja Slicer project

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
  console.error('❌ Error: NOTION_API_KEY environment variable is not set.');
  console.error('   Please add NOTION_API_KEY to your .env file.');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

async function createTasksDatabase(parentPageId) {
  console.log('\n📋 Creating Tasks & Features database...');

  const database = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: 'Tasks & Features' } }],
    properties: {
      'Name': { title: {} },
      'Status': {
        select: {
          options: [
            { name: 'Not Started', color: 'gray' },
            { name: 'In Progress', color: 'blue' },
            { name: 'In Review', color: 'yellow' },
            { name: 'Completed', color: 'green' },
            { name: 'Blocked', color: 'red' }
          ]
        }
      },
      'Type': {
        select: {
          options: [
            { name: 'Feature', color: 'blue' },
            { name: 'Bug', color: 'red' },
            { name: 'Asset', color: 'purple' },
            { name: 'Testing', color: 'yellow' },
            { name: 'Documentation', color: 'gray' },
            { name: 'Refactor', color: 'orange' }
          ]
        }
      },
      'Priority': {
        select: {
          options: [
            { name: 'Critical', color: 'red' },
            { name: 'High', color: 'orange' },
            { name: 'Medium', color: 'yellow' },
            { name: 'Low', color: 'gray' }
          ]
        }
      },
      'Due Date': { date: {} },
      'Progress': { number: { format: 'percent' } },
      'Last Updated': { date: {} },
      'Related Files': { multi_select: {} },
      'Commit Hash': { rich_text: {} },
      'Related Tasks': { relation: { database_id: '', single_property: {} } }
    }
  });

  console.log('✅ Tasks & Features database created');
  console.log('   ID:', database.id);
  return database;
}

async function createDocsDatabase(parentPageId) {
  console.log('\n📚 Creating Documentation Hub database...');

  const database = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: 'Documentation Hub' } }],
    properties: {
      'Title': { title: {} },
      'Doc Type': {
        select: {
          options: [
            { name: 'Spec', color: 'blue' },
            { name: 'Architecture', color: 'purple' },
            { name: 'Guide', color: 'green' },
            { name: 'Plan', color: 'yellow' },
            { name: 'Reference', color: 'gray' }
          ]
        }
      },
      'Last Synced': { date: {} },
      'Source File': { rich_text: {} },
      'Status': {
        select: {
          options: [
            { name: 'Current', color: 'green' },
            { name: 'Outdated', color: 'yellow' },
            { name: 'Archived', color: 'gray' }
          ]
        }
      },
      'Word Count': { number: {} }
    }
  });

  console.log('✅ Documentation Hub database created');
  console.log('   ID:', database.id);
  return database;
}

async function createAssetsDatabase(parentPageId, tasksDbId) {
  console.log('\n🎨 Creating Asset Tracker database...');

  const database = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: 'Asset Tracker' } }],
    properties: {
      'Asset Name': { title: {} },
      'Type': {
        select: {
          options: [
            { name: 'Sprite', color: 'blue' },
            { name: 'Animation', color: 'purple' },
            { name: 'Audio', color: 'yellow' },
            { name: 'Background', color: 'green' },
            { name: 'UI', color: 'orange' },
            { name: 'Effect', color: 'pink' }
          ]
        }
      },
      'Status': {
        select: {
          options: [
            { name: 'Not Started', color: 'gray' },
            { name: 'In Progress', color: 'blue' },
            { name: 'Review', color: 'yellow' },
            { name: 'Complete', color: 'green' }
          ]
        }
      },
      'File Path': { rich_text: {} },
      'Dimensions/Duration': { rich_text: {} },
      'Related Feature': {
        relation: {
          database_id: tasksDbId,
          single_property: {}
        }
      },
      'Preview': { files: {} },
      'Notes': { rich_text: {} }
    }
  });

  console.log('✅ Asset Tracker database created');
  console.log('   ID:', database.id);
  return database;
}

async function createCommitsDatabase(parentPageId, tasksDbId) {
  console.log('\n📝 Creating Commit Log database...');

  const database = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: 'Commit Log' } }],
    properties: {
      'Name': { title: {} },
      'Hash': { rich_text: {} },
      'Author': { rich_text: {} },
      'Timestamp': { date: {} },
      'Files Changed': { multi_select: {} },
      'Commit Type': {
        select: {
          options: [
            { name: 'feat', color: 'blue' },
            { name: 'fix', color: 'red' },
            { name: 'docs', color: 'gray' },
            { name: 'style', color: 'purple' },
            { name: 'refactor', color: 'orange' },
            { name: 'test', color: 'yellow' },
            { name: 'chore', color: 'brown' }
          ]
        }
      },
      'Related Tasks': {
        relation: {
          database_id: tasksDbId,
          single_property: {}
        }
      }
    }
  });

  console.log('✅ Commit Log database created');
  console.log('   ID:', database.id);
  return database;
}

async function updateEnvFile(dbIds) {
  console.log('\n⚙️  Updating .env file...');

  const envPath = path.join(__dirname, '../../.env');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  envContent = envContent.replace(/NOTION_DB_TASKS=.*/, `NOTION_DB_TASKS=${dbIds.tasks}`);
  envContent = envContent.replace(/NOTION_DB_DOCS=.*/, `NOTION_DB_DOCS=${dbIds.docs}`);
  envContent = envContent.replace(/NOTION_DB_ASSETS=.*/, `NOTION_DB_ASSETS=${dbIds.assets}`);
  envContent = envContent.replace(/NOTION_DB_COMMITS=.*/, `NOTION_DB_COMMITS=${dbIds.commits}`);

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated with database IDs');
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🚀 Notion Workspace Setup for Ninja Slicer');
    console.log('═══════════════════════════════════════════════════════');

    // Create parent page for project
    console.log('\n📁 Creating Ninja Slicer parent page...');
    const parentPage = await notion.pages.create({
      parent: { type: 'page_id', page_id: 'workspace' },
      properties: {
        title: { title: [{ text: { content: 'Ninja Slicer' } }] }
      }
    });
    console.log('✅ Parent page created');
    console.log('   ID:', parentPage.id);

    // Create all databases
    const tasksDb = await createTasksDatabase(parentPage.id);
    const docsDb = await createDocsDatabase(parentPage.id);
    const assetsDb = await createAssetsDatabase(parentPage.id, tasksDb.id);
    const commitsDb = await createCommitsDatabase(parentPage.id, tasksDb.id);

    // Update relations in Tasks database to link to Commits
    console.log('\n🔗 Updating database relations...');
    await notion.databases.update({
      database_id: tasksDb.id,
      properties: {
        'Related Tasks': {
          relation: {
            database_id: commitsDb.id,
            single_property: {}
          }
        }
      }
    });
    console.log('✅ Relations updated');

    // Store database IDs
    const dbIds = {
      tasks: tasksDb.id,
      docs: docsDb.id,
      assets: assetsDb.id,
      commits: commitsDb.id
    };

    // Update .env file
    await updateEnvFile(dbIds);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ Setup Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nDatabase IDs:');
    console.log('  Tasks & Features:', dbIds.tasks);
    console.log('  Documentation Hub:', dbIds.docs);
    console.log('  Asset Tracker:', dbIds.assets);
    console.log('  Commit Log:', dbIds.commits);
    console.log('\n🔗 View in Notion:');
    console.log(`  https://notion.so/${parentPage.id.replace(/-/g, '')}`);
    console.log('\n📝 Next steps:');
    console.log('  1. Run: npm run notion:sync-docs');
    console.log('  2. Make a test commit to verify auto-sync');
    console.log('  3. Run: npm run notion:create-task');

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    if (error.body) {
      console.error('Details:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

main();
