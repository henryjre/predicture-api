import { fetchUserMarketData } from "./api.js";

export async function displayUserMarketData() {
  console.log(window.user_id);
  const userMarketData = await fetchUserMarketData(window.user_id);

  console.log(userMarketData);
}
