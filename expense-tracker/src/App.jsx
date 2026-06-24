import { useEffect } from "react";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/Approutes";

function App() {
  useEffect(() => {
    async function loadTheme() {
      try {
        const response = await fetch("http://localhost:3001/preferences");
        const data = await response.json();
        if (data.theme) {
          document.documentElement.dataset.theme = data.theme;
        }
      } catch (error) {
        console.error("Theme not loaded, using default", error);
        document.documentElement.dataset.theme = "light";
      }
    }
    loadTheme();
  }, []);

  return (
    <>
      <Navbar />
      <AppRoutes />
    </>
  );
}

export default App;
