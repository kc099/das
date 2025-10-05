import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QueryProvider from './providers/QueryProvider';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import ProjectDashboard from './pages/ProjectDashboard';
import DashboardCreator from './pages/DashboardCreator';
import FlowEditor from './pages/FlowEditor';
import MqttClustersPage from './pages/MqttClustersPage';
import MqttDashboard from './pages/MqttDashboard';
import Devices from './pages/Devices';
import './App.css';
import './styles/BaseLayout.css';

function App() {
  return (
    <QueryProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Dashboard now serves as project launcher */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Dashboard />} />
        
        {/* Organizations management */}
        <Route path="/organizations" element={<Organizations />} />
        
        {/* Device management */}
        <Route path="/devices" element={<Devices />} />
        
        {/* Project-centric routes */}
        <Route path="/project/:projectUuid" element={<ProjectDashboard />} />
        {/* New (unsaved) Flow */}
        <Route path="/project/:projectUuid/flow" element={<FlowEditor />} />
        {/* Existing Flow */}
        <Route path="/project/:projectUuid/flow/:flowId" element={<FlowEditor />} />
        {/* New (unsaved) Dashboard */}
        <Route path="/project/:projectUuid/dashboard" element={<DashboardCreator />} />
        {/* Existing Dashboard */}
        <Route path="/project/:projectUuid/dashboard/:templateId" element={<DashboardCreator />} />
        
        {/* Legacy routes for backward compatibility */}
        <Route path="/dashboard-creator" element={<DashboardCreator />} />
        <Route path="/flow-editor" element={<FlowEditor />} />
        <Route path="/flow-editor/:flowId" element={<FlowEditor />} />
        
        {/* MQTT routes */}
        <Route path="/mqtt-clusters" element={<MqttClustersPage />} />
        <Route path="/mqtt-dashboard" element={<MqttDashboard />} />
      </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;
