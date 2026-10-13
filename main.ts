// A script which converts the Income Tax India notification RSS feed into an
// Atom feed.
// License: GPLv3

import { Atom } from "jsr:@feed/feed";

const SOURCE_URL =
  "https://www.incometaxindia.gov.in/notification-rss-feed/-/asset_publisher/bxhj/rss";
const SITE_URL = "https://www.incometaxindia.gov.in/";

let fileName = "feed.xml";

interface RssItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
}

// Decode the XML entities used in RSS text and unwrap CDATA sections.
function decodeText(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

// Return the text content of the first <name> element inside a block.
function field(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decodeText(m[1]) : "";
}

// Regex based parsing keeps this free of browser-only APIs such as DOMParser.
function parseItems(xml: string): RssItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? [];
  return blocks.map((b) => {
    const link = field(b, "link");
    return {
      title: field(b, "title"),
      link,
      guid: field(b, "guid") || link,
      pubDate: field(b, "pubDate"),
      description: field(b, "description"),
    };
  });
}

// RSS uses RFC 822 dates, which Date can parse. Fall back to now if it cannot.
function parseDate(s: string): Date {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function fetchXml(): Promise<string> {
  console.info(`Fetching notifications from ${SOURCE_URL}`);
  const r = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; itfeed/1.0)",
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
  });
  if (!r.ok) {
    throw new Error(`HTTP ${r.status} ${r.statusText}`);
  }
  return await r.text();
}

async function main() {
  if (Deno.args.length >= 1) {
    fileName = Deno.args[0];
  }

  let xml: string;
  try {
    xml = await fetchXml();
  } catch (e) {
    console.error(`Failed to fetch the feed: ${e}`);
    Deno.exit(1);
  }

  const items = parseItems(xml);
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
