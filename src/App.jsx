import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "./redux/hooks/useAuth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

import LoginScreen from "./screen/LoginScreen";
import DashboardScreen from "./screen/DashboardScreen";
import MyAccountScreen from "./screen/MyAccountScreen";
import PasswordHistoryScreen from "./screen/PasswordHistoryScreen";
import ReportEventScreen from "./screen/ReportEventScreen";
import ReportDownlineScreen from "./screen/ReportDownlineScreen";
import RestoreUserScreen from "./screen/RestoreUserScreen";
import BankingMasterScreen from "./screen/BankingMasterScreen";
import BankingUserScreen from "./screen/BankingUserScreen";
import CommissionAgentScreen from "./screen/CommissionAgentScreen";
import CommissionUserScreen from "./screen/CommissionUserScreen";
import DownloadMasterlistScreen from "./screen/DownloadMasterlistScreen";
import DownloadUserlistScreen from "./screen/DownloadUserlistScreen";
import MarketAnalysisScreen from "./screen/MarketAnalysisScreen";
import BetlistScreen from "./screen/BetlistScreen";

function App() {
  useAuth();

  const publicRoutes = [
    { path: "/", component: <LoginScreen/> },
  ];

  const privateRoutes = [
    { path: "/dashboard", component: <DashboardScreen/> },
    { path: "/my-account", component: <MyAccountScreen/> },
    { path: "/password-history", component: <PasswordHistoryScreen/> },
    { path: "/report-event", component: <ReportEventScreen/> },
    { path: "/report-downline", component: <ReportDownlineScreen/> },
    { path: "/restore-user", component: <RestoreUserScreen/> },
    { path: "/banking-master", component: <BankingMasterScreen/> },
    { path: "/banking-user", component: <BankingUserScreen/> },
    { path: "/commission-agent", component: <CommissionAgentScreen/> },
    { path: "/commission-user", component: <CommissionUserScreen/> },
    { path: "/downline-masterlist", component: <DownloadMasterlistScreen/> },
    { path: "/downline-userlist", component: <DownloadUserlistScreen/> },
    { path: "/market-analysis", component: <MarketAnalysisScreen/> },
    { path: "/betlist", component: <BetlistScreen/> },
  ];

  return (
    <Router>
      <Routes>
        {publicRoutes.map(({ path, component }) => (
          <Route
            key={path}
            path={path}
            element={<PublicRoute>{component}</PublicRoute>}
          />
        ))}
        {privateRoutes.map(({ path, component }) => (
          <Route
            key={path}
            path={path}
            element={<PrivateRoute>{component}</PrivateRoute>}
          />
        ))}
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
