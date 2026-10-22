# AI Council

A static, mobile-friendly chat room where Sage, Echo, and Bogdan explore your question from different perspectives. Built with HTML, CSS, and native JavaScript modules; no build step or third-party runtime dependencies.

## Run locally

JavaScript modules require HTTP. From the project directory, run:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## Use the council

- **Ask the council** gets one response from each agent.
- **Council Discussion** runs three rounds. Each agent responds in every round, then the app shows a council summary and illustrative agreement percentage.
- Conversation history is saved in this browser's local storage.

The bundled agent replies are sample text, not live AI responses. The agreement percentage is a deterministic demo value, not a measurement of model consensus. The local-only prototype needs no API keys.

## Project structure

- `index.html` contains the application shell.
- `styles.css` contains the responsive dark-theme styling.
- `app.js` manages conversation state, rendering, persistence, and the discussion flow.
- `agents/sage.js`, `agents/echo.js`, and `agents/bogdan.js` define separate agent modules.
- `agents/provider.js` is an optional adapter for a future same-origin provider endpoint.

## Add a live provider later

Configure a server-side endpoint by setting `data-council-endpoint` on the `<html>` element. The endpoint should accept a JSON `POST` with `agent`, `topic`, `round`, and `previousMessages`, and return `{ "content": "..." }`.

The adapter sends conversation data to that endpoint; it does not call model providers directly. OpenAI, Claude, or Gemini credentials must stay on a backend or serverless function, never in this public static site.

## Deploy with GitHub Pages

Publish the repository root as the Pages source. The current local demo runs without a backend; connecting a hosted endpoint is optional.
