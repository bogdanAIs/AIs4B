export const bogdan = {
  id: "bogdan",
  name: "Bogdan",
  role: "Skeptic & risk",
  avatar: "B",
  respond({ topic, round }) {
    const question = topic.replace(/[?!.]+$/, "");
    const responses = [
      `Before settling on an answer to “${question},” ask who might be missing from the conversation and which assumption is doing the most work.`,
      "Consider the strongest counterexample and the cost of being wrong. A confident story is not the same thing as a tested one.",
      "Keep a clear exit ramp: name the warning signs, set a review point, and be willing to update the plan when reality disagrees."
    ];
    return responses[Math.min(round - 1, responses.length - 1)];
  }
};
