# NodeBB Model Context Protocol (MCP) Plugin

[![NodeBB Compatibility](https://img.shields.io/badge/NodeBB-%5E4.0.0-blue.svg)](https://nodebb.org)
[![MCP Protocol](https://img.shields.io/badge/MCP-v1.6.1-green.svg)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-BSD%202--Clause-orange.svg)](LICENSE)

An official **Model Context Protocol (MCP)** server plugin for NodeBB forums. Allows AI assistants (Claude Desktop, Cursor IDE, Antigravity, custom autonomous agents) to interact with NodeBB forums directly via standard Server-Sent Events (SSE) and HTTP message transports.

---

## 🌟 Key Features

- **Standard MCP Protocol**: Built on the official `@modelcontextprotocol/sdk` with SSE transport (`/api/v3/plugins/mcp/sse`).
- **Granular Privilege Mapping**: Every Bearer token maps to a specific NodeBB User ID (UID), strictly enforcing category read/write permissions and moderation rights.
- **ACP Management Dashboard**:
  - Generate, label, and revoke scoped API keys.
  - Toggle tool categories (Read-Only, Write, Moderation).
  - Inspect active SSE agent connections in real-time.
- **Rich AI Toolset**:
  - `search_forum`: Deep search topics and posts.
  - `list_categories` & `get_category_topics`: Explore forum structure.
  - `get_topic` & `get_recent_topics`: Stream discussions and posts.
  - `create_topic` & `create_reply` & `edit_post`: Post and reply autonomously.
  - `get_user_profile` & `get_forum_stats`: Inspect community metadata.
  - `moderate_topic` & `flag_post`: Administrative actions (lock, pin, move, delete).
- **Dynamic Resources & Prompts**:
  - Resources: `nodebb://categories`, `nodebb://topic/{tid}`.
  - Prompts: `summarize_thread`, `draft_announcement`.

---

## 📦 Installation

In your NodeBB installation directory:

```bash
npm install nodebb-plugin-mcp
./nodebb build
./nodebb restart
```

Then navigate to **NodeBB ACP > Plugins > MCP (AI Agent Protocol)** to configure settings and generate your first API token.

---

## 🔌 Connecting AI Clients

### 1. Antigravity IDE (`mcp_config.json`)

Add the following to your workspace's `.agents/mcp_config.json` or global `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "nodebb-talk": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "http://localhost:4567/api/v3/plugins/mcp/sse?token=YOUR_MCP_API_TOKEN"
      ],
      "env": {}
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)

Add the following to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "nodebb-talk": {
      "url": "http://localhost:4567/api/v3/plugins/mcp/sse",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_TOKEN"
      }
    }
  }
}
```

### 3. Cursor IDE

1. Open **Settings > Features > MCP Servers**.
2. Click **Add New MCP Server**.
3. Select **SSE** transport.
4. Set Server URL: `http://localhost:4567/api/v3/plugins/mcp/sse` *(or `https://talk.pthub.me/api/v3/plugins/mcp/sse`)*.
5. Set Header: `Authorization: Bearer <YOUR_MCP_API_TOKEN>`.

---

## 🛠️ MCP Tools Reference

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_forum` | `query`, `searchIn`, `cid`, `page` | Search forum discussions and posts |
| `list_categories` | `parentCid` | List forum categories with post counts |
| `get_category_topics` | `cid`, `page`, `sort` | Paginated topics in a specific category |
| `get_topic` | `tid`, `page`, `perPage` | Retrieve topic metadata and post stream |
| `get_recent_topics` | `page`, `filter` | Latest, popular, top, or unread discussions |
| `create_topic` | `cid`, `title`, `content`, `tags` | Publish a new discussion topic |
| `create_reply` | `tid`, `content`, `toPid` | Post a reply to an existing topic |
| `edit_post` | `pid`, `content`, `title` | Edit an existing post |
| `get_user_profile` | `uid` or `username` | Fetch public user profile and reputation |
| `get_forum_stats` | - | Forum metrics (users, topics, posts) |
| `moderate_topic` | `tid`, `action`, `targetCid` | Lock, pin, move, delete, restore topics |
| `flag_post` | `pid`, `reason` | Flag a post for moderator review |

---

## 🧪 Local Testing & Development

Run with Docker Compose:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Test SSE and tools with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```
Connect to: `http://localhost:4567/api/v3/plugins/mcp/sse?token=YOUR_DEV_TOKEN`.

---

## 📄 License

BSD-2-Clause License &copy; 2026 talk.pthub.me
