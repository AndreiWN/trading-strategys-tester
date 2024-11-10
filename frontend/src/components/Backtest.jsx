import { useState, useCallback } from 'react';
import { Container, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import ImageModal from './ImageModal';
import StrategyModal from './StrategyModal';
import StrategyTable from './StrategyTable';

function Backtest() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const handleOpenStrategyModal = () => {
    console.log('Abrindo modal de estratégia');
    setShowStrategyModal(true);
  };

  const handleCloseStrategyModal = () => {
    console.log('Fechando modal de estratégia');
    setShowStrategyModal(false);
  };

  const handleOpenImageModal = (imageData) => {
    console.log('Abrindo modal de imagem');
    setSelectedImage(imageData);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    console.log('Fechando modal de imagem');
    setShowImageModal(false);
  };

  const handleStrategySave = useCallback((newStrategy) => {
    console.log('Estratégia salva:', newStrategy);
    // Implementar lógica de atualização da tabela, se necessário
  }, []);

  return (
    <Container className="mt-4" data-bs-theme="dark">

      <h1 className="text-center text-white mb-4">Backtests</h1>

      <div className="d-flex justify-content-end mb-3">
        <Button variant="primary" onClick={handleOpenStrategyModal}>
          New Backtest
        </Button>
      </div>

      <ImageModal
        show={showImageModal}
        onHide={handleCloseImageModal}
        imageData={selectedImage}
      />

      <StrategyModal
        show={showStrategyModal}
        onHide={handleCloseStrategyModal}
        onSave={handleStrategySave}
      />

      <StrategyTable />
    </Container>
  );
}

export default Backtest;
