const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const jwtSecret = process.env.JWT_SECRET;
  const netlifyToken = process.env.NETLIFY_API_TOKEN;

  if (!jwtSecret || !netlifyToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  // Verify JWT from cookie
  const cookies = event.headers.cookie || "";
  const tokenMatch = cookies.match(/admin_token=([^;]+)/);
  if (!tokenMatch) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Not authenticated" }),
    };
  }

  try {
    jwt.verify(tokenMatch[1], jwtSecret);
  } catch {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid or expired token" }),
    };
  }

  // Fetch submissions from Netlify Forms API
  try {
    const siteId = process.env.NETLIFY_SITE_ID;
    const formsRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
      { headers: { Authorization: `Bearer ${netlifyToken}` } }
    );

    if (!formsRes.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Failed to fetch forms" }),
      };
    }

    const forms = await formsRes.json();
    const volunteerForm = forms.find((f) => f.name === "volunteer");

    if (!volunteerForm) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions: [] }),
      };
    }

    const subsRes = await fetch(
      `https://api.netlify.com/api/v1/forms/${volunteerForm.id}/submissions?per_page=100`,
      { headers: { Authorization: `Bearer ${netlifyToken}` } }
    );

    if (!subsRes.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Failed to fetch submissions" }),
      };
    }

    const submissions = await subsRes.json();

    const cleaned = submissions.map((s) => ({
      id: s.id,
      created_at: s.created_at,
      first_name: s.data["first-name"] || "",
      last_name: s.data["last-name"] || "",
      email: s.data.email || "",
      phone: s.data.phone || "",
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissions: cleaned }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
