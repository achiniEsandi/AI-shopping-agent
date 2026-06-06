import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URL = "https://mcp.kapruka.com/mcp";

export async function searchKaprukaProducts(query) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_SERVER_URL)
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "kapruka_search_products",
    arguments: {
    params: {
        q: query,
        limit: 5,
        currency: "LKR",
        in_stock_only: true,
        response_format: "json",
    },
    },
  });

  await client.close();

  return result;
}