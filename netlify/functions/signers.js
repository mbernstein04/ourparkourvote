/**
 * Netlify Function: /.netlify/functions/signers
 *
 * Returns the public list of people who signed the demand ("Count the
 * Sheets" / "Sign the Demand & Stay Updated"). Every signature on these
 * forms is a *public* demand by design — the form copy says so — so unlike
 * a general mailing list there is no per-signer "show publicly" opt-in to
 * filter on: everyone who signs is listed (first and last name only; email
 * is never returned).
 *
 * Paginates through the Netlify Forms API 100 submissions at a time until
 * all are fetched, combines across every configured form, then sorts newest
 * first.
 *
 * Env vars:
 *   NETLIFY_API_TOKEN  — personal access token from
 *                        app.netlify.com/user/applications
 *   NETLIFY_FORM_ID    — the demand form id from Site → Forms. Both demand
 *                        forms on the page (the hero box and the #demand
 *                        signing sheet) post to a single "demand" form, so
 *                        this is normally one id. A comma-separated list is
 *                        still supported to combine additional forms (e.g.
 *                        the legacy "hero-signup" form).
 *   SITE_ID            — auto-injected by Netlify at function runtime.
 *
 * Response shape on success (matches the signer-wall script in index.html):
 *   { count: <number>, names: [{ first, last }, ...], updatedAt }
 * Response shape on error (still 200 so the page degrades gracefully):
 *   { count: null, names: [], error: "unavailable" }
 */

exports.handler = async function () {
  const token = process.env.NETLIFY_API_TOKEN;
  const formIdRaw = process.env.NETLIFY_FORM_ID;
  const siteId = process.env.SITE_ID;

  const ok200 = (bodyObj, cacheSeconds) => ({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=' + (cacheSeconds || 60) + ', s-maxage=' + (cacheSeconds || 60),
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(bodyObj)
  });

  if (!token || !formIdRaw) {
    console.log('signers: missing env vars', {
      haveToken: Boolean(token),
      haveFormId: Boolean(formIdRaw),
      haveSiteId: Boolean(siteId)
    });
    return ok200({ count: null, names: [], error: 'unavailable' }, 30);
  }

  // One id, or a comma-separated list of ids to combine.
  const formIds = formIdRaw.split(',').map((s) => s.trim()).filter(Boolean);

  // Prefer the site-scoped endpoint when SITE_ID is present (more reliable);
  // fall back to the unscoped form endpoint if not.
  const buildUrl = (formId, page) => siteId
    ? `https://api.netlify.com/api/v1/sites/${siteId}/forms/${formId}/submissions?per_page=100&page=${page}&state=verified`
    : `https://api.netlify.com/api/v1/forms/${formId}/submissions?per_page=100&page=${page}&state=verified`;

  const PER_PAGE = 100;
  const MAX_PAGES = 50; // hard cap ~5000 submissions per form

  // Netlify surfaces submitted fields on both the top-level submission object
  // and inside `data`; check both, and accept a few field-name variants so a
  // rename on the form doesn't silently empty the wall.
  const pick = (s, keys) => {
    for (const k of keys) {
      if (s.data && s.data[k]) return s.data[k];
      if (s[k]) return s[k];
    }
    return '';
  };

  try {
    const all = [];

    for (const formId of formIds) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await fetch(buildUrl(formId, page), {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`signers: form ${formId} GET page ${page} → ${res.status}`);

        if (!res.ok) {
          return ok200({ count: null, names: [], error: 'unavailable' }, 30);
        }

        const batch = await res.json();
        if (!Array.isArray(batch) || batch.length === 0) break;
        all.push(...batch);
        if (batch.length < PER_PAGE) break;
      }
    }

    const names = all
      .map((s) => {
        const first = String(pick(s, ['first-name', 'first_name', 'firstName', 'first'])).trim();
        let last = String(pick(s, ['last-name', 'last_name', 'lastName', 'last'])).trim();
        // Fall back to a single "name" field if first/last aren't present.
        if (!first && !last) {
          const whole = String(pick(s, ['name', 'full-name', 'fullName'])).trim();
          if (whole) {
            const parts = whole.split(/\s+/);
            return {
              first: parts.shift() || '',
              last: parts.join(' '),
              createdAt: s.created_at || s.createdAt || null
            };
          }
        }
        return { first, last, createdAt: s.created_at || s.createdAt || null };
      })
      .filter((n) => (n.first || n.last) && n.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((n) => ({ first: n.first, last: n.last }));

    console.log(`signers: resolved ${names.length} signers across ${formIds.length} form(s)`);

    return ok200({
      count: names.length,
      names,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.log('signers: fetch threw', err && err.message);
    return ok200({ count: null, names: [], error: 'unavailable' }, 30);
  }
};
