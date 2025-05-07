import { fetchUserMarketData } from "./api.js";

export async function displayUserMarketData() {
  const userMarketData = await fetchUserMarketData(window.user_id);

  console.log(userMarketData);
}
