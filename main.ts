// A script which converts the Income Tax India latest news page into an
// Atom feed.
// License: GPLv3

import { Atom } from "jsr:@feed/feed";

const SOURCE_URL =
  "https://www.incometax.gov.in/iec/foportal/latest-news";

const SITE_URL =
  "https://www.incometax.gov.in/";

let fileName = "it-feed.xml";

interface NewsItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
}

async function fetchPage(): Promise<string> {
  console.info(`Fetching ${SOURCE_URL}`);
  const r = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
      "Accept": "text/html",
    },
  });

  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`);
  }

  return await r.text();
}

function parseNews(html: string): NewsItem[] {
  const items: NewsItem[] = [];
  const regex = /href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const title = match[2].trim();

    if (title.length > 10) {
      items.push({
        title,
        link: match[1].startsWith("http")
          ? match[1]
          : "https://www.incometax.gov.in" + match[1],
        guid: match[1],
        pubDate: new Date().toISOString(),
        description: title,
      });
    }
  }

  return items;
}

// RSS uses RFC 822 dates, or ISO dates. Fall back to now if it cannot parse.
function parseDate(s: string): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function main() {
  if (Deno.args.length >= 1) {
    fileName = Deno.args[0];
  }

  let html: string;
  try {
    html = await fetchPage();
  } catch (e) {
    console.error(`Failed to fetch the page: ${e}`);
    Deno.exit(1);
  }

  const items = parseNews(html);
  if (items.length === 0) {
    console.error("No notifications found in the feed; not overwriting file");
    Deno.exit(1);
  }

  console.info(`Generating feed with ${items.length} items ...`);

  const atomFeed = new Atom({
    title: "Income Tax Notifications",
    description: "Notifications and circulars from the Income Tax India portal",
    link: SITE_URL,
    authors: [
      {
        name: "Income Tax India",
        email: "test@example.org",
      },
    ],
    updated: new Date(),
    id: SITE_URL,
  });

  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.guid)) continue;
    seen.add(item.guid);

    atomFeed.addItem({
      title: item.title,
      link: item.link,
      id: item.guid,
      updated: parseDate(item.pubDate),
      summary: item.title,
      content: {
        body: item.description,
        type: "html",
      },
    });
  }

  try {
    Deno.writeTextFileSync(fileName, atomFeed.build());
    console.log(`Saved to ${fileName}`);
  } catch (e) {
    console.error(`failed to save file: ${fileName}\n${e}`);
    Deno.exit(1);
  }
}

await main();