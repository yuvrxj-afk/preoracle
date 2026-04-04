/**
 * News search grounding via NewsAPI.org.
 * Free tier: 100 requests/day — no credit card needed.
 * Sign up: https://newsapi.org/register
 */

export interface SearchSnippet {
  title: string;
  description: string;
  url: string;
}

export async function searchWeb(query: string, count = 3): Promise<SearchSnippet[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${count}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];

    const data = await resp.json() as {
      articles?: Array<{ title: string; description: string; url: string }>;
    };

    return (data.articles ?? []).slice(0, count).map((a) => ({
      title: a.title,
      description: a.description ?? "",
      url: a.url,
    }));
  } catch {
    return [];
  }
}
