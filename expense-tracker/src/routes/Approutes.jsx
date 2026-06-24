import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import ExpenseDetails from "../pages/Expensedetails";
import Settings from "../pages/Settings";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/expenses/:monthId" element={<ExpenseDetails />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/:theme" element={<Settings />} />
    </Routes>
  );
}

export default AppRoutes;
