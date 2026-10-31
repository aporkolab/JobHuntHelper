const js = require("@eslint/js");
const globals = require("globals");

const gasGlobals = {
	CONFIG: "readonly",
	ScriptApp: "readonly",
	SpreadsheetApp: "readonly",
	CalendarApp: "readonly",
	GmailApp: "readonly",
	Logger: "readonly",
	PropertiesService: "readonly",
	Utilities: "readonly",
	Session: "readonly",
	HtmlService: "readonly",
	Charts: "readonly",
};

module.exports = [{
		ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "*.min.js"]
	},
	js.configs.recommended,
	{
		files: ["src/**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "script", // GAS script, nem Node
			globals: gasGlobals,
		},
		rules: {
			"no-unused-vars": ["error", {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
			}],
			"no-console": "off",
		}
	},
	{
		files: ["tests/**/*.js", "*.config.js", "*.config.cjs"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				...globals.node,
				...globals.jest,
			},
		},
	}
];
