import Anthropic from "@anthropic-ai/sdk";
import { Listing } from "@/types/listing";

export async function processListings(listings: Listing[]): Promise<Listing[]> {
  // Local filter first: remove £0 listings and listings with no title
  const locallyFiltered = listings.filter(
    (l) => l.price > 0 && l.title.trim() !== ""
  );

  // If no API key, skip Claude quality scoring entirely
  if (!process.env.ANTHROPIC_API_KEY) {
    return locallyFiltered;
  }

  // Claude quality scoring is best-effort — any failure returns locally-filtered results
  try {
    const client = new Anthropic();
    const BATCH_SIZE = 50;
    let remaining = locallyFiltered;

    for (let offset = 0; offset < locallyFiltered.length; offset += BATCH_SIZE) {
      const batch = locallyFiltered.slice(offset, offset + BATCH_SIZE);

      const payload = batch.map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        location: l.location,
        description: l.description,
      }));

      const response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `You are a data quality checker for a London student accommodation platform.

Review the following listing data and identify any listing IDs that should be REMOVED because they appear to be:
- Duplicate or near-duplicate titles within the batch
- Nonsensical prices (e.g. £1/month — implausibly cheap, clearly wrong)
- Placeholder or test data (e.g. titles like "test", "xxx", "placeholder")
- Listings clearly outside London (location or title obviously not London)

Listings JSON:
${JSON.stringify(payload, null, 2)}

Respond with ONLY a JSON array of IDs to remove (strings). If nothing should be removed, respond with an empty array [].
Example response: ["id1", "id2"]`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text.trim() : "[]";

      let idsToRemove: string[] = [];
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          idsToRemove = parsed.map(String);
        }
      } catch {
        // Claude returned something we can't parse — skip removal for this batch
      }

      if (idsToRemove.length > 0) {
        const removeSet = new Set(idsToRemove);
        remaining = remaining.filter((l) => !removeSet.has(l.id));
      }
    }

    return remaining;
  } catch {
    // Claude API unavailable or errored — return locally-filtered results
    return locallyFiltered;
  }
}
