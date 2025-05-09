import pool from "../database/db.js";
import Decimal from "decimal.js";

// controllers/userPositionsController.js
import {
  createUserRow,
  getOpenPositions,
  getOpenPositionsByEvent,
  getUserDbData,
} from "../database/userModel.js";
import { createJwtToken } from "../utils/hash.js";
import {
  buySharesToToken,
  sellSharesToToken,
  buyTokenToShares,
  sellTokensToShares,
} from "../utils/lmsr.js";

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
    const open_positions = await getOpenPositionsByEvent(
      user_data.user_id,
      event_id
    );

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

    const { jwtToken, nonce, issuedAt } = createJwtToken(user_id);

    const iat = new Date(issuedAt);

    const query = `
      INSERT INTO jwt_tokens (user_id, token, latest_nonce, date_created) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        token = EXCLUDED.token,
        latest_nonce = EXCLUDED.latest_nonce,
        date_created = EXCLUDED.date_created
      RETURNING *;
    `;

    await pool.query(query, [user_id, jwtToken, nonce, iat]);

    res.json({ ok: true, jwt: jwtToken });
  } catch (err) {
    console.error("Error in rotateToken:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

export function updateAmountInput(req, res) {
  try {
    const {
      amount,
      choice,
      action,
      type,
      shares_data,
      rewards_pool,
      b_constant,
    } = req.query;

    const sharesData = JSON.parse(shares_data);
    const bConstant = new Decimal(b_constant);
    const rewardsPool = new Decimal(rewards_pool);
    const amountDecimal = new Decimal(amount);

    let result;

    if (type === "shares") {
      if (action === "buy") {
        result = buySharesToToken(
          amountDecimal,
          choice,
          sharesData,
          bConstant,
          rewardsPool
        );
      } else if (action === "sell") {
        result = sellSharesToToken(
          amountDecimal,
          choice,
          sharesData,
          bConstant,
          rewardsPool
        );
      }
    } else if (type === "tokens") {
      if (action === "buy") {
        result = buyTokenToShares(
          amountDecimal,
          choice,
          sharesData,
          bConstant,
          rewardsPool
        );
      } else if (action === "sell") {
        result = sellTokensToShares(
          amountDecimal,
          choice,
          sharesData,
          bConstant,
          rewardsPool
        );
      }
    }

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      fee: 0,
      amountEquivalent: 0,
      averagePrice: 0,
      ok: false,
      message: err.message,
    });
  }
}
