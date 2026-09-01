'use strict';

function requireNodeBB(modulePath) {
	if (typeof global.nodebb !== 'undefined' && typeof global.nodebb.require === 'function') {
		return global.nodebb.require(modulePath);
	}
	if (require.main && typeof require.main.require === 'function') {
		try {
			return require.main.require(modulePath);
		} catch (e) {
			// fallback
		}
	}
	try {
		return require(modulePath);
	} catch (e) {
		return {};
	}
}

module.exports = requireNodeBB;
