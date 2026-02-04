import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AutomationLayout from "../components/layout_automation/AppLayout";
import Dashboard from "../pages/Dashboard";

import Recommendations from "../pages/Recomendation";
import Performance from "../pages/Performance";
import Afternoon from "../pages/automation/Afternoon";
import Evening from "../pages/automation/Evening";
import Morning from "../pages/automation/Morning";
import Special from "../pages/automation/Special";
import Weekly from "../pages/automation/Weekly";
// import NotFound from "../pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ALL pages that need sidebar go here */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/performance" element={<Performance />} />
      </Route>
      <Route path="/automation" element={<AutomationLayout />}>
        <Route index element={<Afternoon />} />
        <Route path="Afternoon" element={<Afternoon />} />
        <Route path="Evening" element={<Evening />} />
        <Route path="Morning" element={<Morning />} />
        <Route path="Special" element={<Special />} />
        <Route path="Weekly" element={<Weekly />} />
      </Route>

      {/* Pages without sidebar (optional) */}
     {/* <Route path="*" element={<NotFound />} /> */}
    </Routes> 
  );
};

export default AppRoutes;
