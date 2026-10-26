// Income Tax India Latest News -> Atom Feed
// Source: https://www.incometax.gov.in/iec/foportal/latest-news

import { Atom } from "jsr:@feed/feed";

const SOURCE_URL =
  "https://www.incometax.gov.in/iec/foportal/latest-news";

const SITE_URL =
  "https://www.incometax.gov.in/iec/foportal/latest-news";

let fileName = "it-feed.xml";


interface NewsItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
}


async function fetchPage(): Promise<string> {

  console.log(`Fetching ${SOURCE_URL}`);

  const response = await fetch(SOURCE_URL, {

    headers: {

      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

      "Accept":
        "text/html,application/xhtml+xml"

    }

  });


  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status}`
    );

  }


  return await response.text();

}



function cleanText(text:string){

  return text
    .replace(/\s+/g," ")
    .trim();

}



function parseNews(html: string): NewsItem[] {

  const items: NewsItem[] = [];


  // Split page by notification dates
  const blocks =
    html.split(/(?=\d{2}-[A-Za-z]{3}-\d{4})/g);


  for (const block of blocks) {


    const dateMatch =
      block.match(
        /^(\d{2}-[A-Za-z]{3}-\d{4})/
      );


    if (!dateMatch) {
      continue;
    }


    const date =
      dateMatch[1];


    const pdfMatch =
      block.match(
        /href="([^"]+\.pdf[^"]*)"/i
      );


    if (!pdfMatch) {
      continue;
    }


    const link =
      pdfMatch[1].startsWith("http")
        ? pdfMatch[1]
        : "https://www.incometax.gov.in" + pdfMatch[1];


    // Remove HTML and extract text
    let description =
      block
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();


    // Remove date
    description =
      description.replace(date, "").trim();


    // Remove Click here
    description =
      description.replace(/Click here/gi, "").trim();


    if (description.length < 30) {
      continue;
    }


    items.push({

      title:
        description.substring(0,150),

      link,

      guid:
        link,

      pubDate:
        new Date(date).toISOString(),

      description

    });


  }


  console.log(
    "Parsed notifications:",
    items.length
  );


  return items;

}



function parseDate(date:string){

 const d=new Date(date);

 return Number.isNaN(d.getTime())
 ? new Date()
 : d;

}



async function main(){


 if(Deno.args.length>0){

   fileName=Deno.args[0];

 }



 let html="";


 try{

   html=await fetchPage();

 }

 catch(error){

   console.error(
     "Fetch failed:",
     error
   );

   Deno.exit(1);

 }



 const news=parseNews(html);



 if(news.length===0){

   console.error(
     "No latest news found"
   );

   Deno.exit(1);

 }



 console.log(
   `Generating feed with ${news.length} items`
 );



 const feed=new Atom({

   title:
   "Income Tax Latest News",

   description:
   "Latest notifications from Income Tax India",

   link:SITE_URL,

   id:SITE_URL,

   authors:[{

     name:
     "Income Tax India",

     email:
     "test@example.org"

   }],

   updated:
   new Date()

 });



 const seen=new Set<string>();


 for(const item of news){


   if(seen.has(item.guid))
     continue;


   seen.add(item.guid);



   feed.addItem({

     title:item.title,

     link:item.link,

     id:item.guid,

     updated:
     parseDate(item.pubDate),

     summary:
     item.title,

     content:{

       body:item.description,

       type:"html"

     }

   });


 }



 Deno.writeTextFileSync(
   fileName,
   feed.build()
 );


 console.log(
   `Saved ${fileName}`
 );


}



await main();