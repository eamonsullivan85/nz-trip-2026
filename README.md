# NZ Trip 2026 itinerary, deploy to Railway

This folder is a ready-to-deploy website. It contains the whole itinerary in one
self-contained page (`index.html`, with all photos embedded), a tiny Node server
(`server.js`) and the config Railway needs (`package.json`).

Once it is live, anyone can open the link on their phone and get the full
interactive page: tabs, photos, and clickable restaurant and experience links.
On a phone they can also tap Share, then "Add to Home Screen" to save it like an app.

## Option A: Railway CLI (fastest)

1. Install the CLI (one time): `npm i -g @railway/cli`
2. In a terminal, go into this folder: `cd "path/to/New Zealand 2026/railway-site"`
3. Log in: `railway login`
4. Create and deploy: `railway init` then `railway up`
5. Add a public URL: `railway domain` (this prints the link to share)

## Option B: GitHub, then Railway dashboard

1. Put this `railway-site` folder in a new GitHub repo.
2. Go to railway.app, New Project, Deploy from GitHub repo, pick the repo.
3. Railway auto-detects Node and runs `npm start`.
4. In the service Settings, under Networking, click "Generate Domain" to get the link.

## Updating later

Replace `index.html` with a newer version of the itinerary and redeploy
(`railway up`, or push to GitHub). The link stays the same.

## Notes

- The link is public, anyone with it can view. That is fine for an itinerary.
- Railway's free trial credit is plenty for a small site like this; for a
  longer-lived link consider their cheapest paid tier or a free static host
  such as Cloudflare Pages or GitHub Pages (those need no server file).
