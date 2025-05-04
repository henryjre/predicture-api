import pool from "../db.js";

// Get event data by id event_id
export async function getEventData(eventId) {
  const query = `
    SELECT *
    FROM events
    WHERE event_id = $1;
  `;

  const values = [eventId];

  try {
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) throw new Error("Event not found");
    return { ok: true, message: "Database select success", data: rows[0] };
  } catch (err) {
    console.error("Error querying event:", err);
    return { ok: false, message: "Database select failed", data: [] };
  }
}

// Update shares_data after the trade
export async function updateSharesData(eventId, newShares) {
  const updateQuery = `
    UPDATE events SET shares_data = $1 WHERE event_id = $2;
  `;

  const updateValues = [newShares, eventId];

  try {
    await pool.query(updateQuery, updateValues);
    return { ok: true, message: "Database select success" };
  } catch (err) {
    console.error("Error updating shares_data:", err);
    return { ok: false, message: "Database update failed" };
  }
}
