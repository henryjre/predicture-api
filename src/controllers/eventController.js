import {
  calculatePurchaseCost,
  calculateMarketPrices,
  calculateSellPayout,
  // calculateDynamicB,
} from "../utils/lmsr.js";
import pool from "../database/db.js";

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
  const { user_id, event_id, action, shares, choice, b_const } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the row to avoid race conditions
    const eventRes = await client.query(
      "SELECT * FROM events WHERE event_id = $1 FOR UPDATE",
      [event_id]
    );

    if (eventRes.rowCount === 0) {
      throw new Error("Event not found.");
    }

    const event = eventRes.rows[0];

    const shares_data = event.shares_data;
    const rewards_pool = event.rewards_pool;
    const databaseB = event.b_constant;

    const b_constant = b_const || databaseB;

    // Calculate market before the update
    const marketBefore = calculateMarketPrices(shares_data, b_constant);

    // Compute cost and new shares
    const { rawCost, fee, cost, newShares } = calculatePurchaseCost(
      shares_data,
      b_constant,
      choice,
      shares,
      rewards_pool
    );

    // Update the locked row with new shares
    await client.query(
      `UPDATE events
         SET shares_data  = $1,
             rewards_pool = rewards_pool + $3,
             fees_collected = fees_collected + $4
       WHERE event_id = $2`,
      [newShares, event_id, rawCost, fee]
    );

    const marketAfter = calculateMarketPrices(newShares, b_constant);

    await client.query(
      `INSERT INTO trade_history (event_id, prices, shares_bought, raw_cost)
       VALUES ($1, $2, $3, $4)`,
      [event_id, marketAfter, shares, rawCost]
    );

    await client.query(
      `INSERT INTO user_positions (user_id, event_id, choice, shares, cost_basis, fees_paid)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, event_id, choice)
       DO UPDATE SET
         shares = user_positions.shares + EXCLUDED.shares,
         cost_basis = user_positions.cost_basis + EXCLUDED.cost_basis,
         fees_paid  = user_positions.fees_paid  + EXCLUDED.fees_paid`,
      [
        user_id,
        event_id,
        choice,
        shares, // +shares for buy
        cost, // +cost for buy
        fee,
      ]
    );

    await client.query("COMMIT");

    // console.log(`[BUY] ${user_id} bought ${shares} shares of ${choice}`);
    // console.log(`Current Shares:`, newShares);
    // console.log(`Current Market:`, marketAfter);
    // ("------------------------------------------------------------");

    res.status(200).json({
      ok: true,
      choice,
      action: "buy",
      amountShares: shares,
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
  const { user_id, event_id, shares, choice, b_const } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock event row
    const eventRes = await client.query(
      "SELECT * FROM events WHERE event_id = $1 FOR UPDATE",
      [event_id]
    );

    if (eventRes.rowCount === 0) {
      throw new Error("Event not found.");
    }

    const event = eventRes.rows[0];
    const shares_data = event.shares_data;
    const rewards_pool = event.rewards_pool;

    const b_constant = b_const || event.b_constant;

    console.log(shares_data, rewards_pool, b_constant, choice, shares);

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
      shares,
      rewards_pool
    );

    console.log(rawPayout, fee, payout, newShares);

    // Update the pool
    await client.query(
      `UPDATE events
         SET shares_data   = $1,
             rewards_pool  = rewards_pool - $3,
             fees_collected = fees_collected + $4
       WHERE event_id = $2`,
      [newShares, event_id, rawPayout, fee]
    );

    const marketAfter = calculateMarketPrices(newShares, b_constant);

    await client.query(
      `INSERT INTO trade_history (event_id, prices, shares_bought, raw_cost)
       VALUES ($1, $2, $3, $4)`,
      [event_id, marketAfter, shares, rawPayout]
    );

    await client.query(
      `INSERT INTO user_positions (user_id, event_id, choice, shares, cost_basis, fees_paid)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, event_id, choice)
       DO UPDATE SET
         shares = user_positions.shares + EXCLUDED.shares,
         cost_basis = user_positions.cost_basis + EXCLUDED.cost_basis,
         fees_paid  = user_positions.fees_paid  + EXCLUDED.fees_paid`,
      [
        user_id,
        event_id,
        choice,
        -shares, // –shares for sell
        -payout, // -payout for sell
        fee,
      ]
    );

    await client.query("COMMIT");

    // console.log(`[SELL] ${user_id} sold ${shares} shares of ${choice}`);
    // console.log(`New Shares:`, newShares);
    // console.log(`Market After:`, marketAfter);
    // console.log("------------------------------------------------------------");

    res.status(200).json({
      ok: true,
      choice,
      amountShares: shares,
      action: "sell",
      rawPayout,
      fees: fee,
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

export async function getCurrenMarketData(req, res) {
  const { event_id } = req.params;

  try {
    const eventRes = await pool.query(
      `SELECT  event_title, shares_data, b_constant, rewards_pool
       FROM events
       WHERE event_id = $1`,
      [event_id]
    );
    const event = eventRes.rows[0];

    res.json({
      ok: true,
      title: event.event_title,
      b_constant: event.b_constant,
      shares_data: event.shares_data,
      rewards_pool: event.rewards_pool,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to fetch market data" });
  }
}

export async function getChartData(req, res) {
  const { event_id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT snapshot_time, prices, raw_cost
       FROM trade_history
       WHERE event_id = $1
       ORDER BY snapshot_time ASC`,
      [event_id]
    );

    const eventRes = await pool.query(
      `SELECT event_title, shares_data, rewards_pool, to_char(closes_at, 'Month DD, YYYY') AS formatted_date
       FROM events
       WHERE event_id = $1`,
      [event_id]
    );
    const event = eventRes.rows[0];

    res.json({
      title: event.event_title,
      rewards_pool: event.rewards_pool,
      shares_data: event.shares_data,
      closes_at: event.formatted_date,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Failed to fetch snapshot data" });
  }
}

export async function getEventData(req, res) {
  const { event_id } = req.params;
  try {
    const eventRes = await pool.query(
      `SELECT *, to_char(closes_at, 'Month DD, YYYY') AS formatted_date
       FROM events
       WHERE event_id = $1`,
      [event_id]
    );
    const event = eventRes.rows[0];

    res.json({
      ok: true,
      event: event,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Failed to fetch event data" });
  }
}
