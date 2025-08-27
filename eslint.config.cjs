const js = require("@eslint/js");

module.exports = [{
		ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**", "*.min.js"]
	},
	{
		files: ["src/**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "script", // GAS script, nem Node
			globals: {
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
			}
		},
		rules: {
			...js.configs.recommended.rules,

			"no-unused-vars": ["error", {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_"
			}],
			"no-console": "off",
		}
	}
];
