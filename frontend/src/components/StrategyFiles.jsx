import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Modal } from 'react-bootstrap';
import { API_URL } from '../const';
import UploadModal from './UploadModal';

const StrategyFiles = () => {
  const [strategies, setStrategies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch(`${API_URL}strategies`);
        if (!response.ok) throw new Error('Erro ao buscar estratégias');

        const data = await response.json();
        setStrategies(data);
      } catch (error) {
        console.error('Erro ao buscar estratégias:', error);
        alert('Erro ao buscar estratégias');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [showModal]);

  const handleDownload = (base64Data, fileName, fileType) => {
    try {
      // Remover qualquer prefixo de dados (como "data:;base64,")
      const base64String = base64Data.split(',')[1] || base64Data;

      // Converter Base64 para ArrayBuffer
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: getMimeType(fileType) });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao processar o download do arquivo:', error);
      alert('Erro ao processar o download do arquivo');
    }
  };

  const getMimeType = (fileType) => {
    switch (fileType) {
      case 'ex5':
        return 'application/octet-stream'; // Substitua pelo MIME type correto para EX5
      case 'mq5':
        return 'application/octet-stream'; // Substitua pelo MIME type correto para MQ5
      default:
        return 'application/octet-stream';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta estratégia?')) return;

    try {
      const response = await fetch(`${API_URL}strategies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir estratégia');
      }

      // Atualizar o estado removendo a estratégia excluída
      setStrategies((prevStrategies) =>
        prevStrategies.filter((strategy) => strategy.id !== id)
      );

      alert('Estratégia excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir estratégia:', error);
      alert(`Erro ao excluir estratégia: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-center text-white mb-4">Strategy Files</h1>
      <div className="mb-3 text-end">
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
        >
          Upload Files
        </Button>
      </div>

      <Table striped bordered hover variant="dark" responsive>
        <thead>
          <tr>
            <th>Strategy Name</th>
            <th>Created At</th>
            <th>EX File</th>
            <th>MQ File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((strategy) => (
            <tr key={strategy.id}>
              <td>{strategy.strategy_name}</td>
              <td>
                {new Date(strategy.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td>
                {strategy.strategy_ex_file ? (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleDownload(strategy.strategy_ex_file, `${strategy.strategy_name}.ex5`, 'ex5')}
                  >
                    Download EX
                  </Button>
                ) : (
                  'N/A'
                )}
              </td>
              <td>
                {strategy.strategy_mq_file ? (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleDownload(strategy.strategy_mq_file, `${strategy.strategy_name}.mq5`, 'mq5')}
                  >
                    Download MQ
                  </Button>
                ) : (
                  'N/A'
                )}
              </td>
              <td>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDelete(strategy.id)}
                >
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <UploadModal 
        show={showModal}
        onHide={() => setShowModal(false)}
      />
    </div>
  );
};

export default StrategyFiles;
