import { WebWorkerMLCEngineHandler } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm"

// A handler that resides in the worker thread
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
  handler.onmessage(msg)
}