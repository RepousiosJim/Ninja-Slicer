# Notion Integration Setup Guide

## Quick Setup Steps

###  Step 1: Create Parent Page in Notion

1. Open your Notion workspace
2. Create a new page called **"Ninja Slicer"** (click "+ New Page" in the sidebar)
3. Add an emoji icon: 🥷
4. Leave the page open

### Step 2: Share Page with Integration

1. In your Ninja Slicer page, click the **"..."** menu in the top right
2. Scroll down and click **"Connections"** or **"Add connections"**
3. Find and select your Notion integration (the one with API key starting with `ntn_46321...`)
4. Click **"Confirm"**

### Step 3: Get Page ID

1. Click "**Copy link**" from the page menu
2. The link looks like: `https://www.notion.so/Ninja-Slicer-abc123def456...`
3. Copy everything after the last dash (the 32-character ID)
4. Example: If the URL is `https://www.notion.so/Ninja-Slicer-12345678901234567890123456789012`
   The page ID is: `12345678901234567890123456789012`

### Step 4: Run Automated Setup

Once you have the parent page ID, I'll create all the databases automatically!

---

## What Will Be Created

The setup will create 4 databases inside your Ninja Slicer page:

### 1. 📋 Tasks & Features
Tracks all development tasks, features, bugs, and testing

**Properties:**
- Name, Status, Type, Priority
- Due Date, Progress %, Last Updated
- Related Files, Commit Hash

### 2. 📚 Documentation Hub
Syncs all your markdown documentation

**Properties:**
- Title, Doc Type, Source File
- Last Synced, Status, Word Count

### 3. 🎨 Asset Tracker
Tracks sprites, animations, audio, and other assets

**Properties:**
- Asset Name, Type, Status
- File Path, Preview, Notes
- Related Feature (links to Tasks)

### 4. 📝 Commit Log
Automatically logs every git commit

**Properties:**
- Commit Message, Hash, Author
- Timestamp, Files Changed
- Commit Type, Related Tasks

---

## After Setup

Once databases are created, you can:

```bash
# Sync all documentation to Notion
npm run notion:sync-docs

# Create a new task
npm run notion:create-task

# Every commit will auto-sync to Notion!
git commit -m "feat: your changes"
```

---

## Alternative: Manual Setup

If you prefer to create the databases yourself:

1. Create each database manually in Notion
2. Add the properties listed above
3. Get each database ID (from the URL)
4. Add them to your `.env` file:
   ```
   NOTION_DB_TASKS=your-tasks-db-id
   NOTION_DB_DOCS=your-docs-db-id
   NOTION_DB_ASSETS=your-assets-db-id
   NOTION_DB_COMMITS=your-commits-db-id
   ```
