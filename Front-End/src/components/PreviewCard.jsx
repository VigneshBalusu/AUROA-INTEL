// src/components/PreviewCard.jsx
import React from 'react';
import styles from '../assets/styles/PreviewCard.module.css'; // We'll create this CSS file next

const PreviewCard = ({
    type, // 'history' or 'faq'
    data = [], // Array of strings (FAQs) or chat objects ({ id, title })
    isVisible,
    position = { top: 0, left: 0 }, // Position calculated in Home.jsx
    onMouseEnter, // To keep preview open when hovering over it
    onMouseLeave, // To close preview when leaving it
}) => {
    if (!isVisible || data.length === 0) {
        return null; // Don't render if not visible or no data
    }

    const title = type === 'history' ? 'Recent Chats' : 'Quick FAQs';

    return (
        <div
            className={styles.previewCard}
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <h4 className={styles.previewTitle}>{title}</h4>
            <ul className={styles.previewList}>
                {data.map((item, index) => (
                    <li key={type === 'history' ? item.id : index} className={styles.previewItem}>
                        {type === 'history' ? item.title || 'Untitled Chat' : item}
                    </li>
                ))}
                 {data.length === 0 && <li className={styles.previewItemEmpty}>Nothing to show.</li>}
            </ul>
        </div>
    );
};

export default PreviewCard;