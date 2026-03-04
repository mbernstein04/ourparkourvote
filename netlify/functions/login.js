const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email, password } = JSON.parse(event.body);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminEmail || !adminPasswordHash || !jwtSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid email or password" }),
    };
  }

  const valid = await bcrypt.compare(password, adminPasswordHash);
  if (!valid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid email or password" }),
    };
  }

  const token = jwt.sign({ email: adminEmail, role: "admin" }, jwtSecret, {
    expiresIn: "24h",
  });

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ success: true }),
  };
};
