# Our Park, Our Vote — site update

Static site update for **ourparkourvote.org**, rebuilt around the mandamus petition
(*Bernstein v. Denham*, St. Louis County District Court No. 69DU-CV-26-1924).

## What's in this bundle

| File | Purpose |
|------|---------|
| `index.html` | The main page (nav, sign-up box, What Happened, The Lawsuit + summary, demand sign form, Press) |
| `thank-you-demand.html` | Confirmation page shown after someone signs — served at `/thank-you-demand` |
| `verified-petition-lester-park.pdf` | The filed petition, linked from the "Read the Full Court Filing" button |
| `netlify.toml` | Netlify config (clean URL for the thank-you page, functions dir) |
| `netlify/functions/signers.js` | Serverless function that powers the public signer wall |
| `README.md` | This file |

## Deploy

Copy these into the root of your site repo (the same folder as your existing
`index.html` and image files), then:

```bash
git add index.html thank-you-demand.html verified-petition-lester-park.pdf netlify.toml netlify/functions/signers.js
git commit -m "Update site for verified petition: what-happened, lawsuit summary, demand sign-up, signer wall, press"
git push
```

Netlify rebuilds on push, auto-detects the forms, and deploys the function.

## Required image assets (must already be in your repo)

The page references these — keep them at the site root:

- `lester-sunrise.jpg` — hero background
- `lester-pine.jpg`, `lester-dawn.jpg`, `lester-forest.jpg`, `lester-seeds.jpg` — photo strip

If any are missing you'll see broken images; swap in whatever filenames you have.

## Forms

Two Netlify forms:

- `demand-and-updates` — the hero sign-up box
- `count-the-sheets` — the full demand section

Submissions appear in **Netlify → Forms**. Turn on email/Slack notifications there.
Both forms redirect to `/thank-you-demand` on success.

## The dated urgency strip — remove after the deadline

The red banner at the very top is time-sensitive ("Friday, July 17…"). In `index.html`,
find:

```html
<!-- DATED URGENCY STRIP — remove this block once the meeting window / deadline has passed -->
```

Delete that one `<div class="urgent-strip">…</div>`. The standing green bar below it stays.

## Public signer wall — one-time setup (required for it to work)

The "Duluthians Demanding a Full Count" section is powered by the serverless function
`netlify/functions/signers.js`, which reads your form submissions and returns **names only**
(first + last — the emails are never exposed). It needs two environment variables:

1. **Create a Netlify personal access token:** avatar → **User settings → Applications →
   Personal access tokens → New access token**. Copy it.
2. **Add two variables** in **Site settings → Environment variables**:
   - `NETLIFY_API_TOKEN` = the token from step 1
   - `NETLIFY_SITE_ID` = your site's API ID (**Site settings → General → Site information → Site ID**)
3. Redeploy (or `git push`). The page calls `/.netlify/functions/signers` on load and renders the wall.

Until those variables are set, the function returns an empty list and the section simply invites
people to be the first to sign — no error is shown. Spam is filtered by Netlify (plus a honeypot on
each form), and the function strips control characters, so the wall stays clean.

Names shown match the on-page disclosure exactly: **first and last name only**, never email or address.

## Still to wire (optional)

- **Email updates to signers** — connect Netlify form submissions to your email tool
  (Mailchimp, ActionNetwork, etc.) via a webhook or Zapier.

## Note

This bundle assumes **Netlify** hosting (that's what the form markup targets). On another
host the forms won't capture; swap to Formspree/Google Forms and update each form's `action`.

Ethics points discussed separately (Rule 4.2 pro se + Comment [5], Rule 3.6) are not legal
advice — confirm against Minnesota authority / OLPR.
