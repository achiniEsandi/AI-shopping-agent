import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URL = "https://mcp.kapruka.com/mcp";

async function callKaprukaTool(toolName, params) {
  const client = new Client({
    name: "kapruka-ai-shopping-agent",
    version: "1.0.0",
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: toolName,
      arguments: { params },
    });

    const text = result.content?.[0]?.text || "";

    if (result.isError || text.startsWith("Error")) {
      console.error(`MCP tool error from ${toolName}:`, text);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error(`Non-JSON response from ${toolName}:`, text);
      return null;
    }
  } finally {
    await client.close();
  }
}

export async function searchKaprukaProducts({
  query,
  category = null,
  minPrice = null,
  maxPrice = null,
  limit = 10,
  sort = "relevance",
}) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const data = await callKaprukaTool("kapruka_search_products", {
    q: query,
    category,
    min_price: minPrice,
    max_price: maxPrice,
    limit,
    sort,
    currency: "LKR",
    in_stock_only: true,
    response_format: "json",
  });

  if (!data?.results) return [];

  return data.results.map((product) => ({
    id: product.id,
    name: product.name,
    summary: product.summary,
    price: product.price?.amount,
    currency: product.price?.currency,
    image: product.image_url,
    url: product.url,
    category: product.category?.name,
    inStock: product.in_stock,
  }));
}

export async function getKaprukaProduct(productId) {
  return await callKaprukaTool("kapruka_get_product", {
    product_id: productId,
    currency: "LKR",
    response_format: "json",
  });
}

export async function checkKaprukaDelivery(city, deliveryDate, productId) {
  return await callKaprukaTool("kapruka_check_delivery", {
    city,
    delivery_date: deliveryDate,
    product_id: productId,
    response_format: "json",
  });
}

export async function trackKaprukaOrder(orderNumber) {
  return await callKaprukaTool("kapruka_track_order", {
    order_number: orderNumber,
    response_format: "json",
  });
}

export async function createKaprukaOrder(orderData) {
  return await callKaprukaTool("kapruka_create_order", {
    ...orderData,
    response_format: "json",
  });
}

export async function listKaprukaCategories() {
  return await callKaprukaTool("kapruka_list_categories", {
    depth: 1,
    response_format: "json",
  });
}

export async function listKaprukaDeliveryCities(query = "") {
  return await callKaprukaTool("kapruka_list_delivery_cities", {
    query,
    limit: 50,
    response_format: "json",
  });
}