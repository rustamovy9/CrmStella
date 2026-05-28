import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    groupName: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, groupName }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalIconBox}>
                    <AlertTriangle size={32} color="#EF4444" />
                </div>
                <h3 style={styles.modalTitle}>Удаление занятия</h3>
                <p style={styles.modalText}>
                    Вы уверены, что хотите удалить занятие для группы <strong style={{ color: '#0F172A' }}>{groupName}</strong>? 
                    Это действие нельзя будет отменить.
                </p>
                <div style={styles.modalButtons}>
                    <button onClick={onClose} style={styles.btnCancel}>
                        Отмена
                    </button>
                    <button onClick={onConfirm} style={styles.btnConfirm}>
                        Да, удалить
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.2)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // ИСПРАВЛЕНО: было 'justify'
        zIndex: 9999,
    },
    modalContent: {
        background: '#ffffff',
        borderRadius: 20,
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center' as const,
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
    },
    modalIconBox: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#FEF2F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // ИСПРАВЛЕНО: было 'justify'
        margin: '0 auto 18px auto',
    },
    modalTitle: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: '#0F172A',
        margin: '0 0 8px 0',
    },
    modalText: {
        fontFamily: '"Inter", sans-serif',
        fontSize: '14px',
        color: '#64748B',
        margin: '0 0 24px 0',
        lineHeight: '1.5',
    },
    modalButtons: {
        display: 'flex',
        gap: 12,
    },
    btnCancel: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        background: '#ffffff',
        color: '#475569',
        fontFamily: '"Inter", sans-serif',
        fontSize: '14.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    btnConfirm: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        border: 'none',
        background: '#EF4444',
        color: '#ffffff',
        fontFamily: '"Inter", sans-serif',
        fontSize: '14.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
    }
};

export default DeleteConfirmModal;