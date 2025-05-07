// controllers/userPositionsController.js
import {
  createUserRow,
  getOpenPositions,
  getUserDbData,
} from "../database/userModel.js";

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
    const { user_id, event_id } = req.params;
    const user_data = await getUserDbData(user_id);
    const open_positions = await getOpenPositionsByEvent(user_data, event_id);

    const data = {
      id: user_data.user_id,
      balance: user_data.balance,
      openPositions: open_positions,
    };

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user market data." });
  }
}

export async function createUserData(req, res) {
  try {
    const { user_id } = req.body;

    const result = await createUserRow(user_id);
    if (!result.ok) {
      return res
        .status(500)
        .json({ ok: false, error: result.error, hashString: "" });
    }

    res.json({ ok: true, hashString: result.data.user_hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "Failed to create user data.",
      hashString: "",
    });
  }
}
