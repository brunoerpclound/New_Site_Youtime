import { renderToString } from "react-dom/server";
import App from "./App.jsx";

// Public homepage only: admin routing, storage and browser APIs belong to main.jsx.
export function render(content) {
  return renderToString(<App content={content} />);
}
