import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";

import Recommendations from "../pages/Recomendation";
import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ALL pages that need sidebar go here */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
       
        <Route path="/recommendations" element={<Recommendations />} />
      </Route>

      {/* Pages without sidebar (optional) */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
