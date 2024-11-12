import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { API_URL } from '../const';

const StrategyModal = ({ show, onHide, onSave, editData = null }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    symbol_type: '',
    strategy_name: '',
    period_test: '',
    total_trades: '',
    profit_factor: '',
    sharpe_ratio: '',
    recovery_factor: '',
    win_rate: '',
    set_file: '',
    capital_curve: ''
  });

  const [isLoading, setIsLoading] = useState({
    set_file: false,
    capital_curve: false
  });

  // Resetar o formulário sempre que o modal for aberto
  useEffect(() => {
    if (show) {
      if (editData) {
        setFormData(editData);
      } else {
        setFormData({
          symbol: '',
          symbol_type: '',
          strategy_name: '',
          period_test: '',
          total_trades: '',
          profit_factor: '',
          sharpe_ratio: '',
          recovery_factor: '',
          win_rate: '',
          set_file: '',
          capital_curve: ''
        });
      }
      setIsLoading({
        set_file: false,
        capital_curve: false
      });
    }
  }, [show, editData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : value
    }));
  }, []);

  const handleFileChange = useCallback((e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Limite de tamanho de 5MB
      if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 50MB');
        e.target.value = '';
        return;
      }

      // Validação baseada na extensão do arquivo para set_file
      if (field === 'set_file') {
        const allowedExtensions = ['.set'];
        const fileName = file.name.toLowerCase();
        const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!isValidExtension) {
          alert('Tipo de arquivo inválido para Set File. Apenas arquivos .set são permitidos.');
          e.target.value = '';
          return;
        }
      }

      // Validação baseada no tipo MIME para outros campos, se necessário
      if (field === 'capital_curve') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
          alert('Tipo de arquivo inválido para Capital Curve. Apenas imagens são permitidas.');
          e.target.value = '';
          return;
        }
      }

      // Definir estado de carregamento
      setIsLoading(prev => ({
        ...prev,
        [field]: true
      }));

      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const dataURL = event.target.result; // Data URL completa
          setFormData(prev => ({
            ...prev,
            [field]: dataURL
          }));
        } catch (error) {
          console.error('Erro ao converter arquivo para Base64:', error);
          alert('Erro ao converter o arquivo. Por favor, tente novamente.');
          e.target.value = '';
        } finally {
          // Remover estado de carregamento
          setIsLoading(prev => ({
            ...prev,
            [field]: false
          }));
        }
      };

      reader.onerror = () => {
        console.error('Erro ao ler o arquivo');
        alert('Erro ao ler o arquivo. Por favor, tente novamente.');
        setIsLoading(prev => ({
          ...prev,
          [field]: false
        }));
        e.target.value = '';
      };

      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (isLoading.set_file || isLoading.capital_curve) {
      alert('Por favor, aguarde até que todos os arquivos sejam processados.');
      return;
    }

    try {
      const url = editData 
        ? `${API_URL}backtest/${editData.id}`
        : `${API_URL}backtest`;
      
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(editData ? 'Erro ao atualizar estratégia' : 'Erro ao salvar estratégia');
      }

      const data = await response.json();
      onSave(data);
      onHide();
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message);
    }
  }, [formData, onSave, onHide, isLoading, editData]);

  return (
    <Modal show={show} onHide={onHide} className="text-white" size="lg" data-bs-theme="dark">
      <Modal.Header closeButton>
        <Modal.Title>{editData ? 'Edit Backtest' : 'New Backtest'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Symbol */}
          <Form.Group className="mb-3">
            <Form.Label>Symbol</Form.Label>
            <Form.Control
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* Symbol Type */}
          <Form.Group className="mb-3">
            <Form.Label>Symbol Type</Form.Label>
            <Form.Select
              name="symbol_type"
              value={formData.symbol_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecione um tipo</option>
              <option value="Forex">Forex</option>
              <option value="Ações">Ações</option>
              <option value="Indices">Indices</option>
              <option value="Crypto">Crypto</option>
              <option value="Commodities">Commodities</option>
            </Form.Select>
          </Form.Group>

          {/* Strategy Name */}
          <Form.Group className="mb-3">
            <Form.Label>Strategy Name</Form.Label>
            <Form.Control
              type="text"
              name="strategy_name"
              value={formData.strategy_name}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* Period Test */}
          <Form.Group className="mb-3">
            <Form.Label>Period Test in Years</Form.Label>
            <Form.Control
              type="number"
              name="period_test"
              value={formData.period_test}
              onChange={handleInputChange}
              required
              min="0"
              step="0.1"
            />
          </Form.Group>

          {/* Total Trades */}
          <Form.Group className="mb-3">
            <Form.Label>Total Trades</Form.Label>
            <Form.Control
              type="number"
              name="total_trades"
              value={formData.total_trades}
              onChange={handleInputChange}
              required
              min="0"
            />
          </Form.Group>

          {/* Profit Factor */}
          <Form.Group className="mb-3">
            <Form.Label>Profit Factor</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="profit_factor"
              value={formData.profit_factor}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* Sharpe Ratio */}
          <Form.Group className="mb-3">
            <Form.Label>Sharpe Ratio</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="sharpe_ratio"
              value={formData.sharpe_ratio}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* Recovery Factor */}
          <Form.Group className="mb-3">
            <Form.Label>Recovery Factor</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="recovery_factor"
              value={formData.recovery_factor}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          {/* Win Rate */}
          <Form.Group className="mb-3">
            <Form.Label>Win Rate (%)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="win_rate"
              value={formData.win_rate}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
            />
          </Form.Group>

          {/* Set File */}
          <Form.Group className="mb-3">
            <Form.Label>Set File</Form.Label>
            <Form.Control
              type="file"
              accept=".set" // Aceitar apenas arquivos .set
              onChange={(e) => handleFileChange(e, 'set_file')}
              required
            />
            {isLoading.set_file && <Spinner animation="border" size="sm" className="mt-2" />}
          </Form.Group>

          {/* Capital Curve */}
          <Form.Group className="mb-3">
            <Form.Label>Capital Curve</Form.Label>
            <Form.Control
              type="file"
              accept="image/*" // Aceitar qualquer tipo de imagem
              onChange={(e) => handleFileChange(e, 'capital_curve')}
              required
            />
            {isLoading.capital_curve && <Spinner animation="border" size="sm" className="mt-2" />}
          </Form.Group>

          {/* Botão de Submit */}
          <Button variant="primary" type="submit" disabled={isLoading.set_file || isLoading.capital_curve}>
            { (isLoading.set_file || isLoading.capital_curve) ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                {' Carregando...'}
              </>
            ) : (
              'Salvar Estratégia'
            )}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default StrategyModal;
