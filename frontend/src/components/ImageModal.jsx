import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

const ImageModal = ({ show, onHide, imageData, mimeType = 'png' }) => {
  const [content, setContent] = useState(
    <div className="text-center p-4">Imagem não existente ou inválida</div>
  );

  useEffect(() => {
    console.log('Tipo de imageData:', typeof imageData);
    console.log('Conteúdo de imageData:', imageData);

    if (imageData) {

        setContent(
          <div className="container">
            <img
              src={`${imageData}`}
              alt="Capital Curve"
              style={{ maxWidth: '100%', height: 'auto' }}
              className='rounded'
            />
          </div>
        );
      } else {
        setContent(<div className="text-center p-4">Carregando...</div>);
      }
  }, [imageData, mimeType]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      className="text-white"
      size="lg"
      data-bs-theme="dark"
    >
      <Modal.Header closeButton>
        <Modal.Title>Capital Curve</Modal.Title>
      </Modal.Header>
      <Modal.Body>{content}</Modal.Body>
    </Modal>
  );
};

export default ImageModal;
