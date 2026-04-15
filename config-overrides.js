const path = require('path');

module.exports = function override(config) {
	const babelLoader = config.module.rules
		.find((rule) => Array.isArray(rule.oneOf))
		.oneOf.find(
			(rule) =>
				rule.loader &&
				rule.loader.includes('babel-loader') &&
				rule.include
		);

	if (babelLoader) {
		const firebasePackages = [
			'firebase',
			'@firebase',
		].map((pkg) => path.resolve('node_modules', pkg));

		if (Array.isArray(babelLoader.include)) {
			babelLoader.include.push(...firebasePackages);
		} else {
			babelLoader.include = [babelLoader.include, ...firebasePackages];
		}
	}

	return config;
};
