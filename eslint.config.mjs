import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    ignores: [".claude/**", "node_modules/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        // Leaflet (loaded via CDN script tag)
        L: "readonly",
        // Data globals (each loaded via its own <script> tag)
        BASE_ORGS:      "readonly",
        SHELTERS:       "readonly",
        HOUSING:        "readonly",
        PROGRAMS:       "readonly",
        WAIT_SNAPSHOTS: "readonly",
        LEGAL_SERVICES: "readonly",
      },
    },
    rules: {
      "no-undef":       "warn",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
      "eqeqeq":         ["warn", "always", { null: "ignore" }],
      "no-console":     "off",
    },
  },
];
