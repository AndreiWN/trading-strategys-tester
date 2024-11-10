import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import Backtest from './components/Backtest';
import StrategyFiles from './components/StrategyFiles';
import './App.css';

function App() {
  return (
    <Router>
      <div className="">
        <Sidebar />
        <div className="content-wrapper">
          <Container fluid>
            <Routes>
              <Route path="/backtest" element={<Backtest />} />
              <Route path="/strategies" element={<StrategyFiles strategies={[]} />} />
              <Route path="/" element={<Navigate to="/backtest" replace />} />
            </Routes>
          </Container>
        </div>
      </div>
    </Router>
  );
}

export default App;
