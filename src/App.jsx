import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "./redux/hooks/useAuth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

import LoginScreen from "./screen/LoginScreen";
import DashboardScreen from "./screen/DashboardScreen";


// import PublicFaqsScreen from "./screen/PublicFaqsScreen";

function App() {
  useAuth();

  const publicRoutes = [
    { path: "/", component: <LoginScreen/> },
  ];

  const privateRoutes = [
    { path: "/dashboard", component: <DashboardScreen/> },
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
