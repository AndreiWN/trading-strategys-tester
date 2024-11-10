import React, { useEffect, useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import ImageModal from './ImageModal';
import { API_URL } from '../const';
import { FaChartLine, FaDownload, FaTrash } from 'react-icons/fa';

const StrategyTable = (props) => {
  const [strategies, setStrategies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCapitalCurve, setSelectedCapitalCurve] = useState(null);

  console.log(strategies);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch(`${API_URL}backtest`);
        if (!response.ok) {
          throw new Error('Erro ao buscar estratégias');
        }
        const data = await response.json();
        setStrategies(data);
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    fetchStrategies();
  }, [showModal, props]);

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

  return (
    <>
      <Table striped bordered hover variant="dark" responsive>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Symbol Type</th>
            <th>Strategy Name</th>
            <th>Period Test</th>
            <th>Total Trades</th>
            <th>Profit Factor</th>
            <th>Sharpe Ratio</th>
            <th>Recovery Factor</th>
            <th>Win Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((strategy) => (
            <tr key={strategy.id}>
              <td>{strategy.symbol}</td>
              <td>{strategy.symbol_type}</td>
              <td>{strategy.strategy_name}</td>
              <td>{strategy.period_test}</td>
              <td>{strategy.total_trades}</td>
              <td>{strategy.profit_factor}</td>
              <td>{strategy.sharpe_ratio}</td>
              <td>{strategy.recovery_factor}</td>
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
                  onClick={() => handleDelete(strategy.id)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
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