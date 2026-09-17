"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Quote,
  AtSign,
} from "lucide-react";

interface RichCommentEditorProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isReply?: boolean;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Pre-populate the editor with this text (e.g. "@username ") when it first opens */
  initialValue?: string;
}

export default function RichCommentEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "What do you think? ...",
  submitLabel = "Comment",
  isReply = false,
  error,
  disabled = false,
  autoFocus = false,
  initialValue,
}: RichCommentEditorProps) {
  const [isExpanded, setIsExpanded] = useState(autoFocus);
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const initialValueSet = useRef(false);

  // When editor first expands, insert @mention text and move cursor to end
  useEffect(() => {
    if (isExpanded && !initialValueSet.current && initialValue && editorRef.current) {
      initialValueSet.current = true;
      editorRef.current.innerHTML = "";
      const textNode = document.createTextNode(initialValue);
      editorRef.current.appendChild(textNode);
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      onChange(initialValue);
    }
  }, [isExpanded, initialValue, onChange]);

  // Clear editor div when value is reset externally (e.g. after submit/cancel)
  useEffect(() => {
    if (value === "" && editorRef.current && editorRef.current.innerText.trim() !== "") {
      editorRef.current.innerHTML = "";
      initialValueSet.current = false; // allow re-seeding if editor re-opens
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current?.innerText ?? "");
  }, [onChange]);

  const insertAtCursor = useCallback((text: string) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    onChange(editorRef.current?.innerText ?? "");
  }, [onChange]);

  const wrapInCode = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const code = document.createElement("code");
    code.className = "rich-editor-code";
    if (range.collapsed) {
      code.textContent = "code";
      range.insertNode(code);
      sel.collapse(code, 1);
    } else {
      const fragment = range.extractContents();
      code.appendChild(fragment);
      range.insertNode(code);
      sel.collapseToEnd();
    }
    onChange(editorRef.current?.innerText ?? "");
  }, [onChange]);

  const handleLink = useCallback(() => {
    editorRef.current?.focus();
    const url = window.prompt("Enter link URL:", "https://");
    if (url) exec("createLink", url);
  }, [exec]);

  const TOOLBAR = [
    { icon: Bold,         title: "Bold",           action: () => exec("bold"),                    dividerBefore: false },
    { icon: Italic,       title: "Italic",          action: () => exec("italic"),                  dividerBefore: false },
    { icon: ListOrdered,  title: "Ordered List",    action: () => exec("insertOrderedList"),       dividerBefore: true  },
    { icon: List,         title: "Unordered List",  action: () => exec("insertUnorderedList"),     dividerBefore: false },
    { icon: Link2,        title: "Link",            action: handleLink,                            dividerBefore: true  },
    { icon: Code,         title: "Inline Code",     action: wrapInCode,                            dividerBefore: false },
    { icon: Quote,        title: "Blockquote",      action: () => exec("formatBlock", "blockquote"), dividerBefore: false },
    { icon: AtSign,       title: "Mention",         action: () => insertAtCursor("@"),             dividerBefore: true  },
  ];

  const handleInput = () => {
    if (!isComposing.current) {
      onChange(editorRef.current?.innerText ?? "");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  if (!isExpanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={`w-full bg-card border border-border/80 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-text shadow-xs hover:border-border transition-all ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
        onClick={() => {
          setIsExpanded(true);
          requestAnimationFrame(() => editorRef.current?.focus());
        }}
        onKeyDown={(e) => e.key === "Enter" && setIsExpanded(true)}
      >
        <span className="flex-1 text-sm text-muted-foreground/60 select-none">
          {placeholder}
        </span>
        <div className="w-7 h-7 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
          <AtSign className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className="w-full"
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs focus-within:ring-1 focus-within:ring-border/80 transition-all">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-1.5 border-b border-border/60 flex-wrap">
          {TOOLBAR.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.title}>
                {item.dividerBefore && (
                  <span className="w-px h-4 bg-border/70 mx-1 flex-shrink-0" />
                )}
                <button
                  type="button"
                  title={item.title}
                  onMouseDown={(e) => {
                    // Prevent blur so execCommand keeps its selection
                    e.preventDefault();
                    item.action();
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer flex-shrink-0"
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* ContentEditable area */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          data-placeholder={isReply ? placeholder : "Write your thoughts here..."}
          className="rich-editor-content min-h-[90px] px-4 py-3 text-sm text-foreground focus:outline-none leading-relaxed"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => {
            isComposing.current = false;
            onChange(editorRef.current?.innerText ?? "");
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 border-t border-border/60">
          <span className="text-[11px] font-normal text-muted-foreground/50 tabular-nums">
            {value.length} / 1,000
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (editorRef.current) editorRef.current.innerHTML = "";
                onChange("");
                setIsExpanded(false);
                onCancel?.();
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled || value.trim().length === 0}
              className="bg-[#ff5733] hover:bg-[#e64a19] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs font-medium mt-1.5 px-1">{error}</p>
      )}
    </form>
  );
}
