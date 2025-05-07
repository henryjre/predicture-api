// controllers/userPositionsController.js
import {
  createUserRow,
  getOpenPositions,
  getOpenPositionsByEvent,
  getUserDbData,
} from "../database/userModel.js";
import { decodeBase64Token } from "../utils/hash.js";

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
      return res
        .status(500)
        .json({ ok: false, error: result.error, hashString: "" });
    }

    return res.json({ ok: true, hashString: result.hash });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create user data.",
      hashString: "",
    });
  }
}

export async function samplePost(req, res) {
  try {
    return res.json({ ok: true, message: "Hello, world!" });
  } catch (err) {
    console.error(err);
    res.status(404).json({ ok: false, message: "Failed to fetch." });
  }
}
