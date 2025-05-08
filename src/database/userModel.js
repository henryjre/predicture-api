import moment from "moment-timezone";
import pool from "./db.js";
import { calculateMarketPrices } from "../utils/lmsr.js";
import { createJwtToken } from "../utils/hash.js";

export async function getUserDbData(userId) {
  const res = await pool.query("SELECT * FROM users_data WHERE user_id = $1", [
    userId,
  ]);
  return res.rows[0];
}

export async function getUserPosition(userId, eventId, choice) {
  const res = await pool.query(
    "SELECT * FROM user_positions WHERE user_id = $1 AND event_id = $2 AND choice = $3",
    [userId, eventId, choice]
  );
  return res.rows[0];
}

export async function getOpenPositionsByEvent(userId, eventId) {
  const { rows } = await pool.query(
    `SELECT choice, shares
     FROM user_positions
     WHERE user_id = $1
       AND event_id = $2
       AND shares > 0`,
    [userId, eventId]
  );

  console.log(rows);

  return rows.reduce((acc, r) => {
    acc[r.choice] = Number(r.shares);
    return acc;
  }, {});
}

export async function upsertUserPosition(
  userId,
  eventId,
  choice,
  shares,
  costBasis
) {
  await pool.query(
    `INSERT INTO user_positions (user_id, event_id, choice, shares, cost_basis)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, event_id, choice)
     DO UPDATE SET
       shares = user_positions.shares + EXCLUDED.shares,
       cost_basis = user_positions.cost_basis + EXCLUDED.cost_basis`,
    [userId, eventId, choice, shares, costBasis]
  );
}

export async function getOpenPositions(userId) {
  // 1. Fetch open positions
  const posRes = await pool.query(
    `
    SELECT up.event_id, up.choice, up.shares, up.cost_basis, up.fees_paid
    FROM user_positions up
    LEFT JOIN event_results er ON up.event_id = er.event_id
    WHERE up.user_id = $1
      AND up.shares > 0
      AND er.event_id IS NULL
  `,
    [userId]
  );

  const positions = [];

  for (let row of posRes.rows) {
    const { event_id, choice, shares, cost_basis, fees_paid } = row;

    const evRes = await pool.query(
      `SELECT shares_data, b_constant FROM events WHERE event_id = $1`,
      [event_id]
    );
    if (!evRes.rowCount) continue;
    const { shares_data, b_constant } = evRes.rows[0];

    const priceMap = calculateMarketPrices(shares_data, b_constant);

    // 4. Compute this position's value & P&L
    const marketPrice = priceMap[choice] ?? 0;
    const marketValue = shares * marketPrice;
    const unrealizedPnl = marketValue - cost_basis - fees_paid;

    positions.push({
      event_id,
      choice,
      shares,
      cost_basis,
      fees_paid,
      market_price: marketPrice,
      market_value: marketValue,
      unrealized_pnl: unrealizedPnl,
      status: unrealizedPnl >= 0 ? "Unrealized Profit" : "Unrealized Loss",
    });
  }

  return positions;
}

export async function createUserRow(userId) {
  try {
    const currentDate = moment.tz("Asia/Manila");
    const formattedDate = currentDate.format();

    await pool.query(
      `
      INSERT INTO users_data (user_id, last_updated)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET last_updated = EXCLUDED.last_updated
      RETURNING id, user_id
      `,
      [userId, formattedDate]
    );

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: err, data: [] };
  }
}
