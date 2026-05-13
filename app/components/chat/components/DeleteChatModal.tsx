// app/components/chat/components/DeleteChatModal.tsx
'use client';

import React from 'react';
import styles from '../ChatInterface.module.css';

interface DeleteChatModalProps {
  girlfriendName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteChatModal({
  girlfriendName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteChatModalProps) {
  return (
    <>
      <div className={styles.modalBackdrop} onClick={onCancel} />
      <div className={styles.modal}>
        <p className={styles.modalText}>
          ¿Eliminar todos los mensajes con {girlfriendName}?
        </p>
        <p className={styles.modalSubtext}>Tu nivel de relación se mantendrá.</p>
        <div className={styles.modalButtons}>
          <button
            className={styles.modalCancel}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            className={styles.modalConfirm}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </>
  );
}