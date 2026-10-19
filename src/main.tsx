import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerAndroidBackButton } from "./app/android-back";

registerAndroidBackButton();

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<StrictMode><App /></StrictMode>);
