// src/components/PreviousChats.jsx
import React from 'react';
// ★★★ Use the correct CSS module ★★★
import styles from '../assets/styles/PreviousChats.module.css';

// ★★★ Updated component structure and props ★★★
const PreviousChats = ({
    isOpen,
    chats = [],
    isLoading,
    currentChatId, // For highlighting active chat
    onSelectChat,
    onDeleteChat,
    onNewChat,    // Handler for the new chat button
    onClose,      // Handler for closing the sidebar
    isDeletingId  // ID of chat being deleted
}) => {

    const formatDate = (isoString) => {
        if (!isoString) return 'Unknown date';
        try {
            const date = new Date(isoString);
             // More concise date format
             return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
            console.error("Error formatting date:", isoString, e);
            return "Invalid Date";
        }
    };

    return (
        // ★★★ Use sidebar classes ★★★
        <div className={`${styles.previousChatsSidebar} ${isOpen ? styles.open : ''}`}>
            {/* Sidebar Header */}
            <div className={styles.sidebarHeader}>
                <h2>History</h2>
                <div>
                    {/* Optional: New Chat Button inside sidebar */}
                    <button
                        title="Start New Chat (Ctrl+I)"
                        className={styles.newChatButton}
                        onClick={onNewChat} // ★ Use onNewChat prop
                        aria-label="Start New Chat"
                    >
                        {/* Simple Plus Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                    </button>
                    {/* Close Button */}
                    <button
                        title="Close History"
                        className={styles.closeSidebarButton}
                        onClick={onClose} // ★ Use onClose prop
                        aria-label="Close History Sidebar"
                    >
                        {/* Simple X Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Sidebar Content */}
            <div className={styles.sidebarContent}>
                {isLoading ? (
                    <div className={styles.loadingHistory}>Loading history...</div> // ★ Use correct class
                ) : chats.length === 0 ? (
                    <div className={styles.emptyHistory}>No previous chats found.</div> // ★ Use correct class
                ) : (
                    // ★ Use list structure
                    <ul className={styles.chatList}>
                        {chats.map(chat => (
                            <li
                                key={chat.id}
                                // ★ Add active and deleting classes
                                className={`
                                    ${styles.chatItem}
                                    ${chat.id === currentChatId ? styles.active : ''}
                                    ${chat.id === isDeletingId ? styles.deleting : ''}
                                `}
                                onClick={() => !(isDeletingId === chat.id) && onSelectChat(chat.id)}
                                title={`Select chat: ${chat.title || 'Untitled'}\nLast updated: ${formatDate(chat.lastUpdate)}`}
                                tabIndex={0} // Make focusable
                                onKeyDown={(e) => e.key === 'Enter' && !(isDeletingId === chat.id) && onSelectChat(chat.id)}
                            >
                                {/* Chat Title */}
                                <div className={styles.chatTitle}>{chat.title || 'Untitled Chat'}</div>
                                {/* Chat Meta (Timestamp & Delete Button) */}
                                <div className={styles.chatMeta}>
                                    <span className={styles.chatTimestamp}>{formatDate(chat.lastUpdate)}</span>
                                    <button
                                        title="Delete Chat"
                                        aria-label={`Delete chat: ${chat.title || 'Untitled'}`}
                                        className={styles.deleteChatButton}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent li onClick
                                            onDeleteChat(chat.id);
                                        }}
                                        disabled={isDeletingId === chat.id} // Disable while deleting
                                    >
                                        {/* Trash Icon */}
                                        {isDeletingId === chat.id ? (
                                            <div className={styles.miniLoader}></div> // Show spinner
                                        ) : (
                                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

             {/* Optional Footer Close Button */}
             {/* <button className={styles.sidebarCloseFooter} onClick={onClose}>
                 Close History
             </button> */}

        </div>
    );
};

export default PreviousChats;