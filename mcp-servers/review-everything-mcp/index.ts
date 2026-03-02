import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Load .env from apps/web
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../apps/web/.env") });
dotenv.config({ path: path.join(__dirname, "../../apps/web/.env.local") });

const db = new PrismaClient();
const APPS_WEB_DIR = path.join(__dirname, "../../apps/web");

const server = new Server(
    {
        name: "review-everything-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Tool Definition: list_tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_platforms",
                description: "List all support scraping platforms and their status",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "calculate_roi",
                description: "Calculate ROI and real hourly rate based on campaign data",
                inputSchema: {
                    type: "object",
                    properties: {
                        sponsorship_value: { type: "number", description: "Market value of sponsored goods" },
                        ad_fee: { type: "number", description: "Direct cash payment for the campaign" },
                        campaigns_count: { type: "number", description: "Number of campaigns (def: 1)", default: 1 },
                    },
                    required: ["sponsorship_value", "ad_fee"],
                },
            },
            {
                name: "get_ingest_stats",
                description: "Get statistics of recent ingestion runs",
                inputSchema: { type: "object", properties: { limit: { type: "number", default: 5 } } },
            },
            {
                name: "trigger_ingest",
                description: "Trigger a fresh ingestion run (seeding) to update campaign data",
                inputSchema: { type: "object", properties: {} },
            },
        ],
    };
});

/**
 * Tool Handler: call_tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "list_platforms": {
                const platforms = await db.platform.findMany();
                return {
                    content: [{ type: "text", text: JSON.stringify(platforms, null, 2) }],
                };
            }

            case "get_ingest_stats": {
                const limit = (args?.limit as number) || 5;
                const runs = await db.ingestRun.findMany({
                    orderBy: { start_time: "desc" },
                    take: limit,
                    include: { platform: true },
                });
                return {
                    content: [{ type: "text", text: JSON.stringify(runs, null, 2) }],
                };
            }

            case "trigger_ingest": {
                try {
                    const output = execSync("npx tsx scripts/seed.ts", {
                        cwd: APPS_WEB_DIR,
                        encoding: "utf-8",
                        env: { ...process.env, NODE_ENV: "development" }
                    });
                    return {
                        content: [{ type: "text", text: `Ingestion successful:\n${output}` }],
                    };
                } catch (execError: any) {
                    return {
                        content: [{ type: "text", text: `Ingestion failed: ${execError.message}\n${execError.stdout}\n${execError.stderr}` }],
                        isError: true,
                    };
                }
            }

            case "calculate_roi": {
                const { sponsorship_value, ad_fee, campaigns_count = 1 } = args as any;

                // ROI_LOGIC Skills implementation
                const resale_revenue = Math.floor(sponsorship_value * 0.4);
                const net_profit = ad_fee + resale_revenue;
                const total_hours = campaigns_count * 3.5;
                const hourly_profit = Math.floor(net_profit / total_hours);
                const minimum_wage_gain = Math.floor(total_hours * 9860);

                const result = {
                    net_profit,
                    resale_revenue,
                    total_hours,
                    hourly_profit,
                    is_above_min_wage: hourly_profit > 9860,
                    efficiency_vs_min_wage: Number((hourly_profit / 9860).toFixed(2)),
                    total_opportunity_cost: minimum_wage_gain
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }

            default:
                throw new Error(`Tool not found: ${name}`);
        }
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

/**
 * Main
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("ReviewEverything MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in ReviewEverything MCP:", error);
    process.exit(1);
});
