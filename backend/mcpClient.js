import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URL = "https://mcp.kapruka.com/mcp";

export async function searchKaprukaProducts(query) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));

  await client.connect(transport);

  const result = await client.callTool({
    name: "kapruka_search_products",
    arguments: {
      params: {
        q: query,
        limit: 10,
        currency: "LKR",
        in_stock_only: true,
        response_format: "json",
      },
    },
  });

  await client.close();

const text = result.content?.[0]?.text || "";

if (result.isError || text.startsWith("Error")) {
  console.error("MCP returned error:", text);
  return [];
}

const rawData = JSON.parse(text);

return (rawData.results || []).map((product) => ({
    id: product.id,
    name: product.name,
    summary: product.summary,
    price: product.price?.amount,
    currency: product.price?.currency,
    image: product.image_url,
    url: product.url,
  }));
}

export async function getKaprukaProduct(productId) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));

  await client.connect(transport);

  const result = await client.callTool({
    name: "kapruka_get_product",
    arguments: {
      params: {
        product_id: productId,
        currency: "LKR",
        response_format: "json",
      },
    },
  });

  await client.close();

  return JSON.parse(result.content[0].text);
}

export async function checkKaprukaDelivery(
  city,
  deliveryDate,
  productId
) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_SERVER_URL)
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "kapruka_check_delivery",
    arguments: {
      params: {
        city,
        delivery_date: deliveryDate,
        product_id: productId,
        response_format: "json",
      },
    },
  });

  await client.close();

  return JSON.parse(result.content[0].text);
}

export async function trackKaprukaOrder(orderNumber) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));

  await client.connect(transport);

  const result = await client.callTool({
    name: "kapruka_track_order",
    arguments: {
      params: {
        order_number: orderNumber,
        response_format: "json",
      },
    },
  });

  await client.close();

  return JSON.parse(result.content[0].text);
}

export async function createKaprukaOrder(orderData) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_SERVER_URL)
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "kapruka_create_order",
    arguments: {
      params: {
        ...orderData,
        response_format: "json",
      },
    },
  });

  await client.close();

  return JSON.parse(result.content[0].text);
}