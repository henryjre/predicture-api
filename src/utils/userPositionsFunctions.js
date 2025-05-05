import { upsertUserPosition } from "../database/userPositionsModel.js";

export async function updateUserPosition(
  userId,
  eventId,
  choice,
  action,
  shares,
  price
) {
  const shareChange = action === "buy" ? shares : -shares;
  const costChange = action === "buy" ? shares * price : -shares * price;
  await upsertUserPosition(userId, eventId, choice, shareChange, costChange);
}
