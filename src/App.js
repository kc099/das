import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import DashboardCreator from './DashboardCreator';
import FlowEditor from './FlowEditor';
import MqttClustersPage from './MqttClustersPage';
import MqttDashboard from './MqttDashboard';
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
