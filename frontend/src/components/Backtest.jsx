import { useState, useCallback } from 'react';
import { Container, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import ImageModal from './ImageModal';
import StrategyModal from './StrategyModal';
import StrategyTable from './StrategyTable';

function Backtest() {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const handleOpenStrategyModal = () => {
    setShowStrategyModal(true);
  };

  const handleCloseStrategyModal = () => {
    setShowStrategyModal(false);
  };

  const handleOpenImageModal = (imageData) => {
    setSelectedImage(imageData);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };

  const handleStrategySave = useCallback((newStrategy) => {
    return;
    // Implementar lógica de atualização da tabela, se necessário
  }, []);

  const handleEdit = (strategy) => {
    setEditingStrategy(strategy);
    setShowStrategyModal(true);
  };

  const handleModalClose = () => {
    setShowStrategyModal(false);
    setEditingStrategy(null);
  };

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
        onHide={handleModalClose}
        onSave={handleStrategySave}
        editData={editingStrategy}
      />

      <StrategyTable onEdit={handleEdit} showStrategyModal={showStrategyModal} />
    </Container>
  );
}

export default Backtest;
