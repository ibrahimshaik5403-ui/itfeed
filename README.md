# itfeed

A simple tool which converts the notifications published on the Income Tax India
portal (`incometaxindia.gov.in`) from its official RSS feed into an Atom feed,
which can then be used in feed readers, bots, and automation tools such as
Power Automate or Microsoft Teams.

Source feed:
[https://www.incometaxindia.gov.in/notification-rss-feed/-/asset_publisher/bxhj/rss](https://www.incometaxindia.gov.in/notification-rss-feed/-/asset_publisher/bxhj/rss)

# Installation

## Build Requirements

- [Deno](https://deno.com) v2 or later

## Usage

To run the script:

```
deno task run
```

This will generate `feed.xml` in the current directory, which can be copied to
any location of choice.

The script optionally accepts a custom path to the feed file as the first argument:

```
deno task run /path/to/feed.xml
```

If the source feed cannot be fetched or contains no items, the script exits with
an error and does not touch the existing file, so a previous good feed is kept.

To compile as a binary:

```
deno task build
```

For development:

```
deno task dev
```

# Notes

The Income Tax portal has been seen to return HTTP 403 to some automated clients,
including some cloud-hosted runners. If the scheduled GitHub Actions job fails
with a 403, run the script on a local machine or a Windows Task Scheduler job
instead.

# License

This script is licensed under the GNU `GPLv3`
