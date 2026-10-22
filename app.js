import { sage } from "./agents/sage.js";
import { echo } from "./agents/echo.js";
import { bogdan } from "./agents/bogdan.js";
import { getProviderResponse } from "./agents/provider.js";

const agents = [sage, echo, bogdan];
const storageKey = "ai-council-history-v1";
const messageList = document.querySelector("#message-list");
const emptyState = document.querySelector("#empty-state");
const form = document.querySelector("#question-form");
const input = document.querySelector("#question-input");
const askButton = document.querySelector("#ask-once");
const discussionButton = document.querySelector("#start-discussion");
const characterCount = document.querySelector("#character-count");
const sidebarTopic = document.querySelector("#sidebar-session-topic");
const alignmentCard = document.querySelector("#alignment-card");
const agreementValue = document.querySelector("#agreement-value");
const agreementBar = document.querySelector("#agreement-bar");
const summaryCard = document.querySelector("#summary-card");
const summaryText = document.querySelector("#summary-text");
const summaryPoints = document.querySelector("#summary-points");
const roundSteps = [...document.querySelectorAll(".round-step")];
const agentCards = [...document.querySelectorAll(".agent-card")];

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored && Array.isArray(stored.messages)) {
      return {
        messages: stored.messages.filter((message) =>
          message && (message.kind === "round" || (
            message.kind === "message" &&
            typeof message.text === "string" &&
            ["user", ...agents.map((agent) => agent.id), "summary"].includes(message.role)
          ))
        ),
        agreement: Number.isFinite(stored.agreement) ? stored.agreement : null,
        summary: stored.summary && typeof stored.summary.text === "string" ? stored.summary : null
      };
    }
  } catch {
    return { messages: [], agreement: null, summary: null };
  }
  return { messages: [], agreement: null, summary: null };
}

const state = loadState();
let isBusy = false;

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Keep the current conversation usable when browser storage is unavailable.
  }
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function createMessageElement(message) {
  if (message.kind === "round") {
    const divider = document.createElement("div");
    divider.className = "round-divider";
    divider.textContent = `ROUND ${message.round}`;
    return divider;
  }

  const article = document.createElement("article");
  article.className = `message message-${message.role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.setAttribute("aria-hidden", "true");
  const agent = agents.find((item) => item.id === message.role);
  avatar.textContent = message.role === "user" ? "B" : message.role === "summary" ? "AC" : agent.avatar;

  const content = document.createElement("div");
  content.className = "message-content";
  const topline = document.createElement("div");
  topline.className = "message-topline";
  const author = document.createElement("span");
  author.className = "message-author";
  author.textContent = message.author;
  const role = document.createElement("span");
  role.className = "message-role";
  role.textContent = message.role === "user" ? "YOU" : message.role === "summary" ? "CONCLUSION" : agent.role.toUpperCase();
  const time = document.createElement("time");
  time.className = "message-time";
  time.dateTime = message.createdAt || "";
  time.textContent = formatTime(message.createdAt);
  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = message.text;

  topline.append(author, role, time);
  content.append(topline, text);
  article.append(avatar, content);
  return article;
}

function renderMessages() {
  const fragment = document.createDocumentFragment();
  state.messages.forEach((message) => fragment.append(createMessageElement(message)));
  messageList.replaceChildren(fragment);
  emptyState.hidden = state.messages.some((message) => message.kind === "message");
  const latestQuestion = [...state.messages].reverse().find((message) => message.role === "user");
  sidebarTopic.textContent = latestQuestion ? latestQuestion.text : "Waiting for a question";
  renderConclusion();
  scrollToLatest();
}

function renderConclusion() {
  if (state.agreement === null || !state.summary) {
    alignmentCard.hidden = true;
    summaryCard.hidden = true;
    return;
  }

  alignmentCard.hidden = false;
  summaryCard.hidden = false;
  agreementValue.textContent = state.agreement;
  agreementBar.style.width = `${state.agreement}%`;
  summaryText.textContent = state.summary.text;
  summaryPoints.replaceChildren();
  state.summary.points.forEach((point) => {
    const item = document.createElement("span");
    item.className = "summary-point";
    item.textContent = point;
    summaryPoints.append(item);
  });
}

function scrollToLatest() {
  requestAnimationFrame(() => {
    const conversation = document.querySelector("#conversation");
    conversation.scrollTop = conversation.scrollHeight;
  });
}

function addMessage(message) {
  const savedMessage = { kind: "message", createdAt: new Date().toISOString(), ...message };
  state.messages.push(savedMessage);
  messageList.append(createMessageElement(savedMessage));
  emptyState.hidden = true;
  persist();
  scrollToLatest();
}

function addRoundDivider(round) {
  const divider = { kind: "round", round };
  state.messages.push(divider);
  messageList.append(createMessageElement(divider));
  persist();
}

function setBusy(busy) {
  isBusy = busy;
  input.disabled = busy;
  updateComposer();
  document.querySelector("#agent-list").setAttribute("aria-busy", String(busy));
}

function updateComposer() {
  const hasQuestion = input.value.trim().length > 0;
  askButton.disabled = isBusy || !hasQuestion;
  discussionButton.disabled = isBusy || !hasQuestion;
}

function setActiveAgent(agentId) {
  agentCards.forEach((card) => {
    const isSpeaking = card.dataset.agent === agentId;
    card.classList.toggle("is-speaking", isSpeaking);
    if (isSpeaking) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
  });
}

function setRoundProgress(round, complete = false) {
  roundSteps.forEach((step, index) => {
    step.classList.toggle("is-complete", index < round || complete);
    step.classList.toggle("is-active", !complete && index === round - 1);
  });
}

function addTypingIndicator(agent) {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.setAttribute("role", "status");
  indicator.setAttribute("aria-label", `${agent.name} is thinking`);
  const dots = document.createElement("span");
  const secondDot = document.createElement("span");
  const thirdDot = document.createElement("span");
  const label = document.createElement("span");
  label.textContent = `${agent.name} is thinking`;
  indicator.append(dots, secondDot, thirdDot, label);
  messageList.append(indicator);
  scrollToLatest();
  return indicator;
}

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function getResponse(agent, topic, round) {
  const previousMessages = state.messages
    .filter((message) => message.kind === "message" && message.role !== "user")
    .slice(-12)
    .map(({ author, text }) => ({ author, text }));

  try {
    const providerText = await getProviderResponse({ agent, topic, round, previousMessages });
    if (typeof providerText === "string" && providerText.trim()) return providerText.trim();
  } catch {
    // Fall back to the local sample response if the optional provider is unavailable.
  }

  return agent.respond({ topic, round, previousMessages });
}

async function askAgent(agent, topic, round) {
  setActiveAgent(agent.id);
  const indicator = addTypingIndicator(agent);
  await delay(220);
  const text = await getResponse(agent, topic, round);
  indicator.remove();
  addMessage({ author: agent.name, role: agent.id, round, text });
}

function agreementFor(topic) {
  let hash = 2166136261;
  for (const character of topic) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return 61 + (hash >>> 0) % 24;
}

function createSummary(topic) {
  return {
    text: "The council's shared ground is to make the underlying values explicit, test the most important assumptions, and leave room to revise the decision as evidence changes.",
    points: [
      `Question in view: ${topic}`,
      "Sage: clarify what matters to the people affected.",
      "Echo: choose an observable, low-risk way to learn.",
      "Bogdan: define what would change your mind."
    ]
  };
}

function addConclusion(topic) {
  state.agreement = agreementFor(topic);
  state.summary = createSummary(topic);
  persist();
  renderConclusion();
  addMessage({ author: "AI Council", role: "summary", text: state.summary.text });
  scrollToLatest();
}

function addQuestion(topic) {
  state.agreement = null;
  state.summary = null;
  addMessage({ author: "You", role: "user", text: topic });
  renderConclusion();
}

async function runStandardResponse() {
  const topic = input.value.trim();
  if (!topic || isBusy) return;

  setBusy(true);
  addQuestion(topic);
  input.value = "";
  characterCount.textContent = "0 / 2000";

  try {
    for (const agent of agents) await askAgent(agent, topic, 1);
  } finally {
    setActiveAgent(null);
    setBusy(false);
  }
}

async function runDiscussion() {
  const topic = input.value.trim();
  if (!topic || isBusy) return;

  setBusy(true);
  addQuestion(topic);
  input.value = "";
  characterCount.textContent = "0 / 2000";
  roundSteps.forEach((step) => step.classList.remove("is-active", "is-complete"));

  try {
    for (let round = 1; round <= 3; round += 1) {
      setRoundProgress(round);
      addRoundDivider(round);
      for (const agent of agents) await askAgent(agent, topic, round);
    }
    setRoundProgress(3, true);
    addConclusion(topic);
  } finally {
    setActiveAgent(null);
    setBusy(false);
  }
}

input.addEventListener("input", () => {
  characterCount.textContent = `${input.value.length} / 2000`;
  updateComposer();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (!askButton.disabled) runStandardResponse();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runStandardResponse();
});

discussionButton.addEventListener("click", runDiscussion);

renderMessages();
updateComposer();
