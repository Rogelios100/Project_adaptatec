
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { ErrorBoundary } from "./app/ErrorBoundary.tsx";
  import "./styles/index.css";

  console.log("Main.tsx loaded");
  const rootElement = document.getElementById("root");
  console.log("Root element:", rootElement);
  
  if (rootElement) {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log("App rendered");
  } else {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="color: red; font-size: 20px;">Root element not found!</div>';
  }
  