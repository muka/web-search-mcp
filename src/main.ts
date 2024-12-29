import 'dotenv/config'
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { SerperClient } from "./libs/serper.js";

// Define Zod schemas for validation
const SearchSchema = z.object({
  topic: z.string(),
});

export const main = async() => {

  if (!process.env.SERPER_API_KEY) {
    throw new Error(`Missing env SERPER_API_KEY`)
  }

  const server = new FastMCP({
    name: "web-search",
    version: "1.0.0",
  });

  server.addTool({
    name: "web-search",
    description: "Search the web for a topic",
    parameters: SearchSchema,
    execute: async (args) => {

      try {
        const { topic } = SearchSchema.parse(args);

        console.log(`Search for ${topic}`)

        const client = new SerperClient()
        const res = await client.search(topic)

        if (!res) {
          console.warn(`Failed to retrieve results`)
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrieve results",
              },
            ],
          };
        }

        if (res.organic.length === 0) {
          console.warn(`No results found`)
          return {
            content: [
              {
                type: "text",
                text: `No results found`,
              },
            ],
          };
        }

        const results = res.organic.map(({ title, snippet, link }) => ({ title, snippet, link })).slice(0, 10)

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results),
            },
          ],
        };

      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(
            `Invalid arguments: ${error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`
          );
        }
        throw error;
      }

    },
  });

  server.start({
    transportType: "stdio",
    // transportType: "sse",
    // sse: {
    //   endpoint: '/sse',
    //   port: +(process.env.PORT || 3006)
    // }
  });

}

main().catch(e => console.error(e))