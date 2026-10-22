export const sage = {
  id: "sage",
  name: "Sage",
  role: "Philosopher",
  avatar: "S",
  respond({ topic, round }) {
    const question = topic.replace(/[?!.]+$/, "");
    const responses = [
      `A useful place to begin is with the values inside “${question}.” Which of them should guide the choice, even if the outcome is uncertain?`,
      "It may help to distinguish what can be measured from what matters. Evidence can inform the decision, but it cannot choose your values for you.",
      "A thoughtful next step would honor the people affected while leaving room to learn. The process matters as much as the answer."
    ];
    return responses[Math.min(round - 1, responses.length - 1)];
  }
};
