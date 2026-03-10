import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enable light mode by default
document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")!).render(<App />);
