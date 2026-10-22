export const echo = {
  id: "echo",
  name: "Echo",
  role: "Evidence & method",
  avatar: "E",
  respond({ topic, round }) {
    const question = topic.replace(/[?!.]+$/, "");
    const responses = [
      `For “${question},” first make the assumptions explicit. What observable evidence would support each option, and what is still unknown?`,
      "A small, reversible test could reduce uncertainty. Define what you expect to observe before running it, then compare the result with that prediction.",
      "The evidence can narrow the options, not guarantee an outcome. Record what would change your confidence and revisit the decision when that evidence arrives."
    ];
    return responses[Math.min(round - 1, responses.length - 1)];
  }
};
