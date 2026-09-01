'use strict';

define('admin/plugins/mcp', ['settings', 'alerts', 'bootbox'], function (settings, alerts, bootbox) {
	const ACP = {};

	ACP.init = function () {
		// Save General Settings
		$('#save-settings-btn').on('click', function () {
			settings.save('mcp', $('#mcp-settings-form'), function () {
				alerts.success('MCP Server settings saved successfully!');
			});
		});

		// Save Tool Settings
		$('#save-tools-btn').on('click', function () {
			settings.save('mcp', $('#mcp-tools-form'), function () {
				alerts.success('MCP Tool permissions saved successfully!');
			});
		});

		// Copy Token to Clipboard
		$(document).on('click', '.copy-token-btn', function () {
			const token = $(this).attr('data-token');
			navigator.clipboard.writeText(token).then(function () {
				alerts.success('Token copied to clipboard!');
			});
		});

		// Generate New Token
		$('#confirm-generate-token-btn').on('click', function () {
			const label = $('#token-label').val();
			const uid = $('#token-uid').val();

			if (!label) {
				return alerts.error('Please enter a label for the token.');
			}

			$.ajax({
				url: config.relative_path + '/api/v3/plugins/mcp/admin/tokens',
				type: 'POST',
				headers: {
					'x-csrf-token': config.csrf_token,
				},
				data: { label, uid },
				success: function (data) {
					if (data && data.tokenData) {
						alerts.success('MCP Token generated successfully!');
						const t = data.tokenData;
						const rowHtml = `
							<tr id="token-row-${t.token}">
								<td class="fw-semibold">${t.label}</td>
								<td>
									<code class="mcp-token-code">${t.token}</code>
									<button class="btn btn-sm btn-link text-secondary copy-token-btn" data-token="${t.token}" title="Copy Token">
										<i class="fa fa-copy"></i>
									</button>
								</td>
								<td><span class="badge bg-secondary">UID: ${t.uid}</span></td>
								<td class="text-muted small">${new Date(t.createdAt).toLocaleDateString()}</td>
								<td class="text-end">
									<button class="btn btn-sm btn-outline-danger delete-token-btn" data-token="${t.token}">
										<i class="fa fa-trash"></i> Revoke
									</button>
								</td>
							</tr>
						`;
						$('#tokens-table-body').prepend(rowHtml);
						$('#new-token-modal').modal('hide');
						$('#token-label').val('');
					}
				},
				error: function (xhr) {
					alerts.error(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to generate token');
				},
			});
		});

		// Delete / Revoke Token
		$(document).on('click', '.delete-token-btn', function () {
			const token = $(this).attr('data-token');
			bootbox.confirm('Are you sure you want to revoke this MCP API token? Connected agents will immediately lose access.', function (ok) {
				if (!ok) return;

				$.ajax({
					url: config.relative_path + '/api/v3/plugins/mcp/admin/tokens/' + encodeURIComponent(token),
					type: 'DELETE',
					headers: {
						'x-csrf-token': config.csrf_token,
					},
					success: function () {
						alerts.success('Token revoked.');
						$('#token-row-' + token.replace(/[^a-zA-Z0-9_-]/g, '\\$&')).remove();
					},
					error: function (xhr) {
						alerts.error(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to revoke token');
					},
				});
			});
		});
	};

	return ACP;
});
