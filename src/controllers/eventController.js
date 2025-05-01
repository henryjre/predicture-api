import {
  calculatePurchaseCost,
  calculateMarketPrices,
  calculateSellPayout,
} from "../functions/functionHelpers.js";
import pool from "../db.js";

export async function eventReceive(req, res) {
  const { action } = req.body;

  switch (action) {
    case "buy":
      return await buyEvent(req, res);

    case "sell":
      return await sellEvent(req, res);

    default:
      return res
        .status(404)
        .json({ ok: false, message: "Event action not found" });
  }
}

async function buyEvent(req, res) {
  const { user_id, event_id, action, shares, choice, b_constant } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the row to avoid race conditions
    const eventRes = await client.query(
      "SELECT * FROM events_data WHERE event_id = $1 FOR UPDATE",
      [event_id]
    );

    if (eventRes.rowCount === 0) {
      throw new Error("Event not found.");
    }

    const event = eventRes.rows[0];
    const shares_data = event.shares_data;

    // Calculate market before the update
    const marketBefore = calculateMarketPrices(shares_data, b_constant);

    // Compute cost and new shares
    const { rawCost, fee, cost, newShares } = calculatePurchaseCost(
      shares_data,
      b_constant,
      choice,
      shares
    );

    // Update the locked row with new shares
    await client.query(
      "UPDATE events_data SET shares_data = $1 WHERE event_id = $2",
      [newShares, event_id]
    );

    const marketAfter = calculateMarketPrices(newShares, b_constant);

    await client.query(
      `INSERT INTO price_snapshots (event_id, prices)
       VALUES ($1, $2)`,
      [event_id, marketAfter]
    );

    await client.query("COMMIT");

    // console.log(`[BUY] ${user_id} bought ${shares} shares of ${choice}`);
    // console.log(`Current Shares:`, newShares);
    // console.log(`Current Market:`, marketAfter);
    // ("------------------------------------------------------------");

    res.status(200).json({
      rawCost,
      fees: fee,
      totalCost: cost,
      oldShares: shares_data,
      newShares,
      marketBefore,
      marketAfter,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in buyEvent:", error);
    res.status(500).json({ ok: false, message: error.message });
  } finally {
    client.release();
  }
}

async function sellEvent(req, res) {
  const { user_id, event_id, shares, choice, b_constant } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock event row
    const eventRes = await client.query(
      "SELECT * FROM events_data WHERE event_id = $1 FOR UPDATE",
      [event_id]
    );

    if (eventRes.rowCount === 0) {
      throw new Error("Event not found.");
    }

    const event = eventRes.rows[0];
    const shares_data = event.shares_data;

    // Safety check: avoid negative share pool
    if ((shares_data[choice] || 0) < shares) {
      throw new Error(
        `Insufficient shares of '${choice}' in market pool to sell.`
      );
    }

    const marketBefore = calculateMarketPrices(shares_data, b_constant);

    const { rawPayout, fee, payout, newShares } = calculateSellPayout(
      shares_data,
      b_constant,
      choice,
      shares
    );

    // Update the pool
    await client.query(
      "UPDATE events_data SET shares_data = $1 WHERE event_id = $2",
      [newShares, event_id]
    );

    const marketAfter = calculateMarketPrices(newShares, b_constant);

    await client.query(
      `INSERT INTO price_snapshots (event_id, prices)
       VALUES ($1, $2)`,
      [event_id, marketAfter]
    );

    await client.query("COMMIT");

    // console.log(`[SELL] ${user_id} sold ${shares} shares of ${choice}`);
    // console.log(`New Shares:`, newShares);
    // console.log(`Market After:`, marketAfter);
    // console.log("------------------------------------------------------------");

    res.status(200).json({
      rawPayout,
      fee,
      payout,
      oldShares: shares_data,
      newShares,
      marketBefore,
      marketAfter,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in sellEvent:", error);
    res.status(500).json({ ok: false, message: error.message });
  } finally {
    client.release();
  }
}

export async function getPriceData(req, res) {
  const { event_id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT snapshot_time, prices
       FROM price_snapshots
       WHERE event_id = $1
       ORDER BY snapshot_time ASC`,
      [event_id]
    );

    const eventRes = await pool.query(
      `SELECT event_title
       FROM events_data
       WHERE event_id = $1`,
      [event_id]
    );
    const event = eventRes.rows[0];

    res.json({ title: event.event_title, data: rows });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to fetch price history" });
  }
}
