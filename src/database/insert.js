import pool from "../db.js";

export const insertBuySellQueue = async (
  userId,
  eventId,
  action,
  shares,
  choice,
  b
) => {
  const query = `
      INSERT INTO buy_sell_queue (user_id, event_id, action, shares, choice, b_constant)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

  const values = [userId, eventId, action, shares, choice, b];

  try {
    const { rows } = await pool.query(query, values);
    return rows[0]; // Return the inserted row
  } catch (err) {
    console.error("Error inserting into buy_sell_queue:", err);
    throw new Error("Database insert failed");
  }
};
