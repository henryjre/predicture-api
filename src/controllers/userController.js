import pool from "../database/db.js";

// controllers/userPositionsController.js
import {
  createUserRow,
  getOpenPositions,
  getOpenPositionsByEvent,
  getUserDbData,
} from "../database/userModel.js";
import { createJwtToken } from "../utils/hash.js";

export async function openPositions(req, res) {
  try {
    const userId = req.params.userId;
    const data = await getOpenPositions(userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch open positions." });
  }
}

export async function getUserMarketData(req, res) {
  try {
    const { user_id, event_id } = req.body;

    const user_data = await getUserDbData(user_id);
    const open_positions = await getOpenPositionsByEvent(user_data, event_id);

    const data = {
      ok: true,
      id: user_data.user_id,
      balance: user_data.balance,
      openPositions: open_positions,
    };

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function createUserData(req, res) {
  try {
    const { user_id } = req.body;

    const result = await createUserRow(user_id);

    if (!result.ok) {
      return res.status(500).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create user data.",
    });
  }
}

export async function rotateToken(req, res) {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ ok: false, error: "User ID is required" });
    }

    const { jwtToken, issuedAt } = createJwtToken(user_id);

    const iat = new Date(issuedAt);
    const ipAddress = extractIPv4(req.ip) || "0.0.0.0";
    console.log("ipAddress", ipAddress);

    const query = `
      INSERT INTO jwt_tokens (user_id, token, ip_address, date_created) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        token = EXCLUDED.token,
        ip_address = EXCLUDED.ip_address,
        date_created = EXCLUDED.date_created
      RETURNING *;
    `;

    await pool.query(query, [user_id, jwtToken, ipAddress, iat]);

    res.json({ ok: true, jwt: jwtToken });
  } catch (err) {
    console.error("Error in rotateToken:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }

  function extractIPv4(ip) {
    if (ip.startsWith("::ffff:")) {
      return ip.split("::ffff:")[1];
    }
    return ip;
  }
}
