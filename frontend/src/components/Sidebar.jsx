import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaChartLine, FaCogs, FaHome } from 'react-icons/fa'; // Importando ícones

const NavigationBar = () => {
  const location = useLocation();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          {/* Você pode substituir por um logotipo */}
          <FaHome className="me-2" />
          Strategus Valt
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              as={Link} 
              to="/backtest"
              active={location.pathname === '/backtest'}
              className="d-flex align-items-center"
            >
              <FaChartLine className="me-1" />
              Backtest
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/strategies"
              active={location.pathname === '/strategies'}
              className="d-flex align-items-center"
            >
              <FaCogs className="me-1" />
              Estratégias
            </Nav.Link>
            {/* Adicione mais itens conforme necessário */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
