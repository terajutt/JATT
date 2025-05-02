import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";

// Import Material Icons
const materialIconsLink = document.createElement("link");
materialIconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
materialIconsLink.rel = "stylesheet";
document.head.appendChild(materialIconsLink);

// Import Poppins and Lato fonts
const fontsLink = document.createElement("link");
fontsLink.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap";
fontsLink.rel = "stylesheet";
document.head.appendChild(fontsLink);

// Set page title
document.title = "JATT AIRLINES - Premium Cab Service";

createRoot(document.getElementById("root")!).render(<App />);
