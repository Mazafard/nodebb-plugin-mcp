<div class="acp-page-container">
	<div class="row m-0">
		<div id="mcp-admin-container" class="col-12 p-0">
			<!-- Header Banner -->
			<div class="mcp-header-card d-flex align-items-center justify-content-between mb-4 p-4 rounded-3 shadow-sm">
				<div class="d-flex align-items-center gap-3">
					<div class="mcp-icon-badge">
						<i class="fa fa-brain fa-2x text-primary"></i>
					</div>
					<div>
						<h3 class="mb-1 fw-bold">Model Context Protocol (MCP) Server</h3>
						<p class="text-muted mb-0">Connect Claude Desktop, Cursor, Antigravity, and autonomous AI agents directly to your NodeBB forum.</p>
					</div>
				</div>
				<div class="d-flex align-items-center gap-2">
					<span class="badge bg-success px-3 py-2 fs-6">
						<i class="fa fa-circle me-1" style="font-size: 8px;"></i>
						<span id="mcp-active-sessions">{activeSessionsCount}</span> Active Agent(s)
					</span>
				</div>
			</div>

			<!-- Tabs Navigation -->
			<ul class="nav nav-pills mb-4 gap-2" id="mcp-tabs" role="tablist">
				<li class="nav-item" role="presentation">
					<button class="nav-link active rounded-pill px-4" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" role="tab">
						<i class="fa fa-sliders me-2"></i> General Settings
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="tokens-tab" data-bs-toggle="tab" data-bs-target="#tokens" type="button" role="tab">
						<i class="fa fa-key me-2"></i> Agent API Tokens
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="tools-tab" data-bs-toggle="tab" data-bs-target="#tools" type="button" role="tab">
						<i class="fa fa-wrench me-2"></i> Tool Permissions
					</button>
				</li>
				<li class="nav-item" role="presentation">
					<button class="nav-link rounded-pill px-4" id="docs-tab" data-bs-toggle="tab" data-bs-target="#docs" type="button" role="tab">
						<i class="fa fa-book me-2"></i> Client Connection Guide
					</button>
				</li>
			</ul>

			<!-- Tab Contents -->
			<div class="tab-content" id="mcp-tab-content">
				<!-- Tab 1: General Settings -->
				<div class="tab-pane fade show active" id="general" role="tabpanel">
					<form id="mcp-settings-form" class="card shadow-sm p-4 border-0 rounded-3">
						<h5 class="fw-bold mb-3"><i class="fa fa-cogs text-primary me-2"></i> Core Server Configuration</h5>

						<div class="form-check form-switch mb-3">
							<input class="form-check-input" type="checkbox" id="enabled" name="enabled" {{{ if settings.enabled }}}checked{{{ end }}}>
							<label class="form-check-label fw-semibold" for="enabled">Enable MCP Server Plugin</label>
							<div class="form-text">When disabled, all SSE connections and MCP tool calls will return 503 Service Unavailable.</div>
						</div>

						<div class="form-check form-switch mb-3">
							<input class="form-check-input" type="checkbox" id="requireAuth" name="requireAuth" {{{ if settings.requireAuth }}}checked{{{ end }}}>
							<label class="form-check-label fw-semibold" for="requireAuth">Enforce Bearer Token Authentication</label>
							<div class="form-text">Recommended. Ensures only AI agents with registered tokens can interact with the MCP server.</div>
						</div>

						<div class="mb-3">
							<label class="form-label fw-semibold" for="botUid">Default Bot Fallback User ID (UID)</label>
							<input type="number" class="form-control" id="botUid" name="botUid" value="{settings.botUid}" min="1" placeholder="1" style="max-width: 250px;">
							<div class="form-text">User ID used when unauthenticated requests are permitted or token UID is unassigned.</div>
						</div>

						<div class="mb-3">
							<label class="form-label fw-semibold" for="rateLimitPerMinute">Rate Limit (Requests per minute per agent)</label>
							<input type="number" class="form-control" id="rateLimitPerMinute" name="rateLimitPerMinute" value="{settings.rateLimitPerMinute}" min="10" max="600" style="max-width: 250px;">
						</div>

						<div class="d-flex justify-content-end mt-4">
							<button type="button" class="btn btn-primary px-4" id="save-settings-btn">
								<i class="fa fa-save me-2"></i> Save Settings
							</button>
						</div>
					</form>
				</div>

				<!-- Tab 2: Agent API Tokens -->
				<div class="tab-pane fade" id="tokens" role="tabpanel">
					<div class="card shadow-sm p-4 border-0 rounded-3">
						<div class="d-flex justify-content-between align-items-center mb-4">
							<div>
								<h5 class="fw-bold mb-1"><i class="fa fa-key text-primary me-2"></i> Active MCP API Tokens</h5>
								<p class="text-muted mb-0">Generate scoped Bearer tokens for Cursor, Claude Desktop, Antigravity, or internal bot scripts.</p>
							</div>
							<button class="btn btn-success" id="open-new-token-modal" data-bs-toggle="modal" data-bs-target="#new-token-modal">
								<i class="fa fa-plus me-1"></i> Generate New Token
							</button>
						</div>

						<div class="table-responsive">
							<table class="table table-hover align-middle">
								<thead class="table-light">
									<tr>
										<th>Label</th>
										<th>Token Key</th>
										<th>Bound NodeBB UID</th>
										<th>Created</th>
										<th class="text-end">Actions</th>
									</tr>
								</thead>
								<tbody id="tokens-table-body">
									{{{ each tokens }}}
									<tr id="token-row-{@token}">
										<td class="fw-semibold">{@label}</td>
										<td>
											<code class="mcp-token-code">{@token}</code>
											<button class="btn btn-sm btn-link text-secondary copy-token-btn" data-token="{@token}" title="Copy Token">
												<i class="fa fa-copy"></i>
											</button>
										</td>
										<td><span class="badge bg-secondary">UID: {@uid}</span></td>
										<td class="text-muted small">{@createdAt}</td>
										<td class="text-end">
											<button class="btn btn-sm btn-outline-danger delete-token-btn" data-token="{@token}">
												<i class="fa fa-trash"></i> Revoke
											</button>
										</td>
									</tr>
									{{{ end }}}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Tab 3: Tool Permissions -->
				<div class="tab-pane fade" id="tools" role="tabpanel">
					<form id="mcp-tools-form" class="card shadow-sm p-4 border-0 rounded-3">
						<h5 class="fw-bold mb-3"><i class="fa fa-shield-alt text-primary me-2"></i> MCP Capability & Tool Scopes</h5>
						<p class="text-muted mb-4">Control which classes of tools AI agents are allowed to invoke on this forum.</p>

						<div class="row g-4">
							<div class="col-md-4">
								<div class="p-3 border rounded-3 h-100 bg-light">
									<div class="form-check form-switch mb-2">
										<input class="form-check-input" type="checkbox" id="enableReadTools" name="enableReadTools" {{{ if settings.enableReadTools }}}checked{{{ end }}}>
										<label class="form-check-label fw-bold" for="enableReadTools">Read Tools</label>
									</div>
									<p class="small text-muted mb-2">Allows searching forum, viewing categories, reading topics, posts, user profiles, and forum statistics.</p>
									<span class="badge bg-info text-dark">search_forum, get_topic, list_categories</span>
								</div>
							</div>

							<div class="col-md-4">
								<div class="p-3 border rounded-3 h-100 bg-light">
									<div class="form-check form-switch mb-2">
										<input class="form-check-input" type="checkbox" id="enableWriteTools" name="enableWriteTools" {{{ if settings.enableWriteTools }}}checked{{{ end }}}>
										<label class="form-check-label fw-bold" for="enableWriteTools">Write Tools</label>
									</div>
									<p class="small text-muted mb-2">Allows creating new topics, posting replies, and editing posts authored by the bound UID.</p>
									<span class="badge bg-warning text-dark">create_topic, create_reply, edit_post</span>
								</div>
							</div>

							<div class="col-md-4">
								<div class="p-3 border rounded-3 h-100 bg-light">
									<div class="form-check form-switch mb-2">
										<input class="form-check-input" type="checkbox" id="enableModTools" name="enableModTools" {{{ if settings.enableModTools }}}checked{{{ end }}}>
										<label class="form-check-label fw-bold" for="enableModTools">Moderation Tools</label>
									</div>
									<p class="small text-muted mb-2">Allows locking, pinning, moving, deleting topics, and flagging posts (requires mod privileges).</p>
									<span class="badge bg-danger">moderate_topic, flag_post</span>
								</div>
							</div>
						</div>

						<div class="d-flex justify-content-end mt-4">
							<button type="button" class="btn btn-primary px-4" id="save-tools-btn">
								<i class="fa fa-save me-2"></i> Save Tool Permissions
							</button>
						</div>
					</form>
				</div>

				<!-- Tab 4: Client Connection Guide -->
				<div class="tab-pane fade" id="docs" role="tabpanel">
					<div class="card shadow-sm p-4 border-0 rounded-3">
						<h5 class="fw-bold mb-3"><i class="fa fa-plug text-primary me-2"></i> How to Connect Your AI Assistants</h5>
						
						<div class="alert alert-info d-flex align-items-center gap-3 mb-4">
							<i class="fa fa-info-circle fa-2x"></i>
							<div>
								<strong>SSE Endpoint URL:</strong>
								<code class="ms-2 fs-6">{forumUrl}/api/v3/plugins/mcp/sse</code>
							</div>
						</div>

						<h6 class="fw-bold mb-2"><i class="fa fa-rocket text-primary me-2"></i> 1. Antigravity IDE (`mcp_config.json`)</h6>
						<p class="text-muted small">Place in your workspace root <code>.agents/mcp_config.json</code> or global <code>~/.gemini/config/mcp_config.json</code>:</p>
						<pre class="bg-dark text-light p-3 rounded-3 mb-4"><code>{
  "mcpServers": {
    "nodebb-talk": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "{forumUrl}/api/v3/plugins/mcp/sse?token=YOUR_MCP_API_TOKEN"
      ],
      "env": {}
    }
  }
}</code></pre>

						<h6 class="fw-bold mb-2"><i class="fa fa-robot text-warning me-2"></i> 2. Claude Desktop (`claude_desktop_config.json`)</h6>
						<pre class="bg-dark text-light p-3 rounded-3 mb-4"><code>{
  "mcpServers": {
    "nodebb-talk": {
      "url": "{forumUrl}/api/v3/plugins/mcp/sse",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_TOKEN"
      }
    }
  }
}</code></pre>

						<h6 class="fw-bold mb-2"><i class="fa fa-code text-info me-2"></i> 3. Cursor IDE Setup</h6>
						<p class="text-muted small">Open <strong>Cursor Settings &gt; Features &gt; MCP Servers &gt; Add New MCP Server</strong>:</p>
						<ul class="small text-muted mb-0">
							<li><strong>Name:</strong> <code>nodebb-talk</code></li>
							<li><strong>Type:</strong> <code>sse</code></li>
							<li><strong>URL:</strong> <code>{forumUrl}/api/v3/plugins/mcp/sse</code></li>
							<li><strong>Header:</strong> <code>Authorization: Bearer YOUR_MCP_API_TOKEN</code></li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal: Generate New Token -->
<div class="modal fade" id="new-token-modal" tabindex="-1" aria-hidden="true">
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title fw-bold"><i class="fa fa-key me-2 text-success"></i> Generate MCP API Token</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<div class="mb-3">
					<label class="form-label fw-semibold" for="token-label">Token Label / Description</label>
					<input type="text" class="form-control" id="token-label" placeholder="e.g. Claude Desktop Assistant" required>
				</div>
				<div class="mb-3">
					<label class="form-label fw-semibold" for="token-uid">Bound NodeBB User ID (UID)</label>
					<input type="number" class="form-control" id="token-uid" value="1" min="1" required>
					<div class="form-text">All tool actions executed with this token will act as this user.</div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-success" id="confirm-generate-token-btn">Generate Token</button>
			</div>
		</div>
	</div>
</div>
