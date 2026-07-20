import { QdrantClient } from "@qdrant/js-client-rest";

const url = process.env.QDRANT_URL || "";
const apiKey = process.env.QDRANT_API_KEY || "";
const collection = process.env.QDRANT_COLLECTION || "qabuddy";

export const qdrantClient = new QdrantClient({
  url,
  apiKey: apiKey || undefined,
});

export { collection as qdrantCollection };
