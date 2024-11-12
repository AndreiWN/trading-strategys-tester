import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';
import ImageModal from './ImageModal';
import { API_URL } from '../const';
import { FaChartLine, FaDownload, FaTrash, FaSort, FaSortUp, FaSortDown, FaEdit } from 'react-icons/fa';

const StrategyTable = ({ onEdit, showStrategyModal }) => {
  const [strategies, setStrategies] = useState([]);
  const [filteredStrategies, setFilteredStrategies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCapitalCurve, setSelectedCapitalCurve] = useState(null);

  // Estados para filtragem
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterSymbolType, setFilterSymbolType] = useState('');
  const [filterStrategyName, setFilterStrategyName] = useState('');

  // Estados para ordenação
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch(`${API_URL}backtest`);
        if (!response.ok) {
          throw new Error('Erro ao buscar estratégias');
        }
        const data = await response.json();
        setStrategies(data);
        setFilteredStrategies(data); // Inicialmente, sem filtros
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    fetchStrategies();
  }, [showStrategyModal]);

  // Função para aplicar filtros
  useEffect(() => {
    let filtered = [...strategies];

    if (filterSymbol) {
      filtered = filtered.filter(strategy =>
        strategy.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
      );
    }

    if (filterSymbolType) {
      filtered = filtered.filter(strategy =>
        strategy.symbol_type.toLowerCase().includes(filterSymbolType.toLowerCase())
      );
    }

    if (filterStrategyName) {
      filtered = filtered.filter(strategy =>
        strategy.strategy_name.toLowerCase().includes(filterStrategyName.toLowerCase())
      );
    }

    // Aplicar ordenação após filtragem
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Se os valores forem números, comparar numericamente
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Comparar como strings
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredStrategies(filtered);
  }, [strategies, filterSymbol, filterSymbolType, filterStrategyName, sortConfig]);

  const handleShowCapitalCurve = (capitalCurve) => {
    setSelectedCapitalCurve(capitalCurve);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCapitalCurve(null);
  };

  const handleDownloadSet = (setFile, strategyName, symbol) => {
    // Verifica se setFile contém o prefixo 'data:'
    const base64String = setFile.startsWith('data:')
      ? setFile.split(',')[1] // Remove o prefixo
      : setFile; // Usa a string inteira se não houver prefixo

    try {
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/octet-stream' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${strategyName} - ${symbol}.set`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao decodificar a string base64:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta estratégia?')) {
      try {
        const response = await fetch(`${API_URL}backtest/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Erro ao excluir estratégia');
        }
        setStrategies(strategies.filter(strategy => strategy.id !== id));
      } catch (error) {
        console.error('Erro:', error);
      }
    }
  };

  // Função para manipular a ordenação ao clicar no cabeçalho
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar ícones de ordenação
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort />;
    }
    if (sortConfig.direction === 'asc') {
      return <FaSortUp />;
    }
    return <FaSortDown />;
  };

  return (
    <>
      {/* Seção de filtros */}
      <Form className="mb-3 text-white">
        <Row>
          <Col md={4}>
            <Form.Group controlId="filterSymbol">
              <Form.Label>Filtrar por Symbol</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o símbolo"
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="filterSymbolType">
              <Form.Label>Filtrar por Symbol Type</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o tipo de símbolo"
                value={filterSymbolType}
                onChange={(e) => setFilterSymbolType(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="filterStrategyName">
              <Form.Label>Filtrar por Strategy Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome da estratégia"
                value={filterStrategyName}
                onChange={(e) => setFilterStrategyName(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>

      <Table striped bordered hover variant="dark" responsive>
        <thead>
          <tr>
            <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>
              Symbol {renderSortIcon('symbol')}
            </th>
            <th onClick={() => handleSort('symbol_type')} style={{ cursor: 'pointer' }}>
              Symbol Type {renderSortIcon('symbol_type')}
            </th>
            <th onClick={() => handleSort('strategy_name')} style={{ cursor: 'pointer' }}>
              Strategy Name {renderSortIcon('strategy_name')}
            </th>
            <th onClick={() => handleSort('period_test')} style={{ cursor: 'pointer' }}>
              Period Test {renderSortIcon('period_test')}
            </th>
            <th onClick={() => handleSort('total_trades')} style={{ cursor: 'pointer' }}>
              Total Trades {renderSortIcon('total_trades')}
            </th>
            <th onClick={() => handleSort('profit_factor')} style={{ cursor: 'pointer' }}>
              Profit Factor {renderSortIcon('profit_factor')}
            </th>
            <th onClick={() => handleSort('sharpe_ratio')} style={{ cursor: 'pointer' }}>
              Sharpe Ratio {renderSortIcon('sharpe_ratio')}
            </th>
            <th onClick={() => handleSort('win_rate')} style={{ cursor: 'pointer' }}>
              Win Rate {renderSortIcon('win_rate')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStrategies.length > 0 ? (
            filteredStrategies.map((strategy) => (
              <tr key={strategy.id}>
                <td>{strategy.symbol}</td>
                <td>{strategy.symbol_type}</td>
                <td>{strategy.strategy_name}</td>
                <td>{strategy.period_test}</td>
                <td>{strategy.total_trades}</td>
                <td>{strategy.profit_factor}</td>
                <td>{strategy.sharpe_ratio}</td>
                <td>{strategy.win_rate}%</td>
                <td>
                  <Button 
                    variant="info" 
                    size="sm" 
                    className="me-2"
                    onClick={() => handleShowCapitalCurve(String(strategy.capital_curve))}
                  >
                    <FaChartLine />
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm"
                    className="me-2"
                    onClick={() => handleDownloadSet(strategy.set_file, strategy.strategy_name, strategy.symbol)}
                  >
                    <FaDownload />
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    className="me-2"
                    onClick={() => handleDelete(strategy.id)}
                  >
                    <FaTrash />
                  </Button>
                  <Button 
                    variant="warning" 
                    size="sm" 
                    onClick={() => onEdit(strategy)}
                  >
                    <FaEdit />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center">
                Nenhuma estratégia encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <ImageModal 
        show={showModal}
        onHide={handleCloseModal}
        imageData={selectedCapitalCurve}
        title="Curva de Capital"
      />
    </>
  );
};

export default StrategyTable;
