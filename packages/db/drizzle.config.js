"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const drizzle_kit_1 = require("drizzle-kit");
const env_1 = require("./src/env");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(__dirname, "../../.env") });
const env = (0, env_1.parseDatabaseEnv)(process.env);
exports.default = (0, drizzle_kit_1.defineConfig)({
    dialect: "postgresql",
    schema: [
        "./src/auth/index.ts",
        "./src/organization/index.ts",
        "./src/project/index.ts",
        "./src/documents/index.ts",
        "./src/notes/index.ts",
        "./src/hr/index.ts",
        "./src/billing/index.ts",
        "./src/agent/index.ts",
        "./src/ai/index.ts",
    ],
    out: "./drizzle",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
});
