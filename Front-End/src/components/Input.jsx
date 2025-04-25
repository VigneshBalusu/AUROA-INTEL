// src/components/Input.jsx
import React, { useEffect, useRef } from 'react';
// ★ Use the correct path to YOUR CSS Module ★
import styles from '../assets/styles/Input.module.css'; // <-- Check this path

const Input = React.forwardRef(({
    value,               // Current value from parent
    onInputChange,       // Function to call when input changes
    onSubmit,            // Function to call when submitting
    loading = false,
    placeholder = "Ask Aurora Intel anything...", // Default placeholder
    disabled = false,
    onKeyDown,           // Pass external keydown handler (e.g., from Home)
    onFocus,             // Pass parent's focus handler
    onBlur               // Pass parent's blur handler
}, ref) => { // Forwarded ref

    const textareaRef = useRef(null); // Local ref for auto-resizing

    // Combine forwarded ref and local ref
    const setRefs = (el) => {
        textareaRef.current = el;
        if (ref) {
            if (typeof ref === 'function') {
                ref(el);
            } else {
                ref.current = el;
            }
        }
    };

    // Auto-resize textarea based on content
    useEffect(() => {
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            const maxHeight = parseInt(window.getComputedStyle(ta).maxHeight, 10) || Infinity;
            const requiredHeight = ta.scrollHeight;
            ta.style.height = `${Math.min(requiredHeight, maxHeight)}px`;
            ta.style.overflowY = requiredHeight > maxHeight ? 'auto' : 'hidden';
        }
    }, [value]);

    const handleInputChange = (event) => {
        if (onInputChange) {
            onInputChange(event.target.value);
        }
    };

    const handleButtonClick = (e) => {
        e.preventDefault();
        if (value && value.trim() && !loading && !disabled) {
            onSubmit(value);
        }
        textareaRef.current?.focus();
    };

    const handleKeyDownInternal = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (value && value.trim() && !loading && !disabled) {
                 onSubmit(value);
            }
        }
        if (onKeyDown) { onKeyDown(event); }
    };

    return (
        // This wrapper contains the textarea and button
        <div className={styles.inputWrapper}>
            <textarea
                ref={setRefs}
                className={styles.inputField}
                value={value || ''}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled || loading}
                onKeyDown={handleKeyDownInternal}
                rows={1}
                onFocus={onFocus} // Call parent's onFocus
                onBlur={onBlur}   // Call parent's onBlur
                aria-label="Chat message input"
            />
            <button
                type="button"
                className={styles.sendButton}
                onClick={handleButtonClick}
                disabled={disabled || loading || !value || !value.trim()}
                aria-label="Send message"
                title="Send message"
            > ➲
                {/* Chevron Right SVG Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
            </button>
        </div>
    );
});

export default Input;