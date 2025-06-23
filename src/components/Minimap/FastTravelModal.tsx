// src/components/Minimap/FastTravelModal.tsx

import React from 'react';
import styles from './Minimap.module.css';
import { Position } from '../../types/global.types';

interface FastTravelModalProps {
  options: Array<{ mapId: string; position: Position; name: string }>;
  onSelect: (mapId: string, position: Position) => void;
  onClose: () => void;
}

const FastTravelModal: React.FC<FastTravelModalProps> = ({ options, onSelect, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Fast Travel</h3>
        {options.length === 0 ? (
          <p>No fast travel destinations available.</p>
        ) : (
          <ul className={styles.destinationList}>
            {options.map((option, index) => (
              <li key={`${option.mapId}-${index}`} className={styles.destinationItem}>
                <button
                  className={styles.destinationButton}
                  onClick={() => onSelect(option.mapId, option.position)}
                >
                  {option.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default FastTravelModal;