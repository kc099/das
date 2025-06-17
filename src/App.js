import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DashboardCreator from './pages/DashboardCreator';
import FlowEditor from './pages/FlowEditor';
import MqttClustersPage from './pages/MqttClustersPage';
import MqttDashboard from './pages/MqttDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/dashboard-creator" element={<DashboardCreator />} />
        <Route path="/flow-editor" element={<FlowEditor />} />
        <Route path="/flow-editor/:flowId" element={<FlowEditor />} />
        <Route path="/mqtt-clusters" element={<MqttClustersPage />} />
        <Route path="/mqtt-dashboard" element={<MqttDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
