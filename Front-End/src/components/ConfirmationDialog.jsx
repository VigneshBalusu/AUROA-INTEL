// src/components/ConfirmationDialog.jsx
import React from 'react';
import styles from '../assets/styles/ConfirmationDialog.module.css';

const ConfirmationDialog = ({
    isOpen,
    message,
    onConfirm, // Function to call if user confirms
    onCancel,  // Function to call if user cancels
    confirmText = "Delete",
    cancelText = "Cancel"
}) => {
    if (!isOpen) {
        return null; // Don't render if not open
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.dialogCard}>
                <p className={styles.dialogMessage}>{message}</p>
                <div className={styles.dialogActions}>
                    <button
                        className={`${styles.dialogButton} ${styles.cancelButton}`}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`${styles.dialogButton} ${styles.confirmButton}`}
                        onClick={onConfirm}
                        // autoFocus // Optionally focus the confirm button
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;