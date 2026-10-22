export async function getProviderResponse({ agent, topic, round, previousMessages }) {
  const endpoint = document.documentElement.dataset.councilEndpoint;
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: agent.id,
      topic,
      round,
      previousMessages
    })
  });

  if (!response.ok) throw new Error(`Council provider returned ${response.status}`);
  const data = await response.json();
  return typeof data.content === "string" ? data.content : null;
}
