const { Resend } = require("resend");

exports.handler = async (event) => {
  const { form_name, data } = JSON.parse(event.body).payload;

  // Only send auto-reply for volunteer form submissions
  if (form_name !== "volunteer") {
    return { statusCode: 200, body: "Not a volunteer submission, skipping." };
  }

  const email = data.email;
  const firstName = data["first-name"] || "";

  if (!email) {
    return { statusCode: 200, body: "No email provided, skipping." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Our Park Our Vote <info@ourparkourvote.org>",
    to: email,
    subject: "Welcome to Get 5 — Our Park, Our Vote",
    html: buildEmail(firstName),
  });

  return { statusCode: 200, body: "Email sent." };
};

function buildEmail(firstName) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  return `
<div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a2e;line-height:1.75;">
  <div style="background:#0f2a0f;padding:1.5rem 2rem;text-align:center;border-bottom:3px solid #c8922a;">
    <span style="font-family:Arial Black,sans-serif;font-size:1.1rem;color:#e8b84a;letter-spacing:0.05em;text-transform:uppercase;">Our Park Our Vote</span>
  </div>

  <div style="padding:2rem;background:#faf4e8;">
    <p style="font-size:1.1rem;margin-bottom:1rem;">${greeting}</p>

    <p style="margin-bottom:1rem;">Thank you for volunteering to volunteer. Here's everything you need to get started with <strong>Get 5</strong>.</p>

    <h2 style="font-size:1.2rem;color:#c8922a;margin:1.5rem 0 0.75rem;border-bottom:1px solid #e8b84a;padding-bottom:0.5rem;">How It Works</h2>

    <p style="margin-bottom:0.75rem;">Every week, get <strong>5 people</strong> to sign a hard copy of the petition. Friends. Neighbors. People you already talk to.</p>

    <p style="margin-bottom:0.75rem;">Every <strong>Sunday at 5:55 pm</strong>, hop on a <strong>5-minute conference call</strong> to report your haul. We'll send you the call-in number separately.</p>

    <p style="margin-bottom:1rem;">For every conference call you come on, you'll receive a complimentary <strong>six-pack of native plants</strong> — even if you didn't get any signatures that week.</p>

    <h2 style="font-size:1.2rem;color:#c8922a;margin:1.5rem 0 0.75rem;border-bottom:1px solid #e8b84a;padding-bottom:0.5rem;">Talking Points</h2>

    <p style="margin-bottom:0.5rem;">When you ask people to sign, here are a few things to mention:</p>

    <ul style="margin:0.5rem 0 1rem 1.25rem;">
      <li style="margin-bottom:0.5rem;"><strong>This isn't anti-development — it's pro-democracy.</strong> We're asking that Duluth voters get a say before public parkland is rezoned for private development.</li>
      <li style="margin-bottom:0.5rem;"><strong>Lester Park belongs to all of us.</strong> It's been public parkland for over a century. Selling it off sets a precedent for every park in the city.</li>
      <li style="margin-bottom:0.5rem;"><strong>The petition triggers a public vote.</strong> With enough valid signatures from registered Duluth voters, the city is required to put the rezoning question on the ballot.</li>
      <li style="margin-bottom:0.5rem;"><strong>You must be a registered Duluth voter to sign.</strong> Each signature must be on a hard copy — digital signatures don't count for this process.</li>
      <li style="margin-bottom:0.5rem;"><strong>It takes 30 seconds.</strong> Print the petition, hand someone a pen, done.</li>
    </ul>

    <h2 style="font-size:1.2rem;color:#c8922a;margin:1.5rem 0 0.75rem;border-bottom:1px solid #e8b84a;padding-bottom:0.5rem;">The Petition</h2>

    <p style="margin-bottom:1rem;">Download, print, and get it signed. Mail completed petitions to the address on the form.</p>

    <p style="text-align:center;margin:1.5rem 0;">
      <a href="https://ourparkourvote.org/petition.pdf" style="display:inline-block;background:#c8922a;color:#fff;padding:0.75rem 2rem;text-decoration:none;font-family:Arial,sans-serif;font-size:0.9rem;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;border-radius:2px;">Download Petition (PDF)</a>
    </p>

    <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid #ddd;">
      <p style="font-size:0.9rem;color:#666;">Questions? Reply to this email or reach us at <a href="mailto:info@ourparkourvote.org" style="color:#c8922a;">info@ourparkourvote.org</a></p>
      <p style="font-size:0.85rem;color:#999;margin-top:0.5rem;">Our Park Our Vote is a not-for-profit, community-driven initiative to require voter approval before Lester Park can be rezoned from parkland.</p>
    </div>
  </div>
</div>`;
}
