import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { API_URL } from '../const';

const UploadModal = ({ show, onHide }) => {
  const [strategyName, setStrategyName] = useState('');
  const [files, setFiles] = useState({
    ex: null,
    mq: null
  });
  const [errors, setErrors] = useState({
    ex: '',
    mq: '',
    upload: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (event, fileType) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (
        (fileType === 'ex' && !['ex4', 'ex5'].includes(extension)) ||
        (fileType === 'mq' && !['mq4', 'mq5'].includes(extension))
      ) {
        setErrors(prev => ({
          ...prev,
          [fileType]: `Arquivo inválido. Por favor, selecione um arquivo .${fileType}4 ou .${fileType}5`
        }));
        setFiles(prev => ({
          ...prev,
          [fileType]: null
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [fileType]: ''
        }));
        setFiles(prev => ({
          ...prev,
          [fileType]: selectedFile
        }));
      }
    } else {
      setFiles(prev => ({
        ...prev,
        [fileType]: null
      }));
      setErrors(prev => ({
        ...prev,
        [fileType]: ''
      }));
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove o prefixo data:<type>;base64,
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    try {
      setSuccessMessage('');
      setErrors(prev => ({ ...prev, upload: '' }));

      // Validação
      if (!strategyName.trim()) {
        setErrors(prev => ({ ...prev, upload: 'Por favor, insira um nome para a estratégia.' }));
        return;
      }

      if (!files.ex || !files.mq) {
        setErrors(prev => ({ ...prev, upload: 'Por favor, selecione ambos os arquivos EX e MQ.' }));
        return;
      }

      setIsUploading(true);

      // Ler os arquivos como Base64
      const [exBase64, mqBase64] = await Promise.all([
        readFileAsBase64(files.ex),
        readFileAsBase64(files.mq)
      ]);

      // Enviar a requisição para o backend
      const response = await fetch(`${API_URL}upload/strategies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strategy_name: strategyName,
          strategy_ex_file: exBase64,
          strategy_mq_file: mqBase64
        })
      });

      // Tentar analisar a resposta como JSON
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error('Resposta do servidor não é JSON válido.');
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao enviar arquivos.');
      }

      setSuccessMessage(responseData.message || 'Arquivos enviados com sucesso!');
      
      // Limpa os campos após o upload
      setStrategyName('');
      setFiles({ ex: null, mq: null });
      // Limpa os inputs de arquivo
      document.getElementById('upload-ex').value = '';
      document.getElementById('upload-mq').value = '';
    } catch (error) {
      console.error('Erro ao enviar arquivos:', error);
      setErrors(prev => ({ ...prev, upload: error.message || 'Erro ao enviar arquivos.' }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} className="text-white" data-bs-theme="dark">
      <Modal.Header closeButton className="text-white">
        <Modal.Title>Upload Files</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-white">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Strategy Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Strategy Name"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload EX5</Form.Label>
            <Form.Control
              type="file"
              accept=".ex4,.ex5"
              onChange={(e) => handleFileChange(e, 'ex')}
              id="upload-ex"
            />
            {files.ex && (
              <Form.Text className="text-muted">
                File selected: {files.ex.name}
              </Form.Text>
            )}
            {errors.ex && (
              <Alert variant="danger" className="mt-2">
                {errors.ex}
              </Alert>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload MQ5</Form.Label>
            <Form.Control
              type="file"
              accept=".mq4,.mq5"
              onChange={(e) => handleFileChange(e, 'mq')}
              id="upload-mq"
            />
            {files.mq && (
              <Form.Text className="text-muted">
                File selected: {files.mq.name}
              </Form.Text>
            )}
            {errors.mq && (
              <Alert variant="danger" className="mt-2">
                {errors.mq}
              </Alert>
            )}
          </Form.Group>
          {errors.upload && (
            <Alert variant="danger" className="mt-2">
              {errors.upload}
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success" className="mt-2">
              {successMessage}
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isUploading}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />{' '}
              Sending...
            </>
          ) : (
            'Send'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadModal;
