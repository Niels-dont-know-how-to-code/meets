import React, { useState, useRef, useCallback } from 'react';
import { SendHorizontal } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="flex-1 font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-surface-secondary focus:ring-2 focus:ring-meets-500 focus:outline-none resize-none min-h-[40px] max-h-[120px]"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="w-10 h-10 rounded-full bg-meets-500 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
      >
        <SendHorizontal size={18} />
      </button>
    </div>
  );
}
