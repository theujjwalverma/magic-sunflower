"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  Palette,
  Highlighter,
} from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const colorPalette = [
  "#000000",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#F3F4F6",
  "#FFFFFF",
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
];

const highlightColors = [
  "#FEF3C7",
  "#DBEAFE",
  "#D1FAE5",
  "#FCE7F3",
  "#E0E7FF",
  "#F3E8FF",
  "#FEF2F2",
  "#FFF7ED",
  "#F0FDF4",
  "#ECFEFF",
  "#F0F9FF",
  "#FAF5FF",
];

export function RichTextEditor({
  content = "",
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection && editorRef.current) {
        // Get the selection coordinates
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();

          // Position toolbar above the selection, relative to editor
          setToolbarPosition({
            top: rect.top - editorRect.top - 50, // 50px above selection
            left: Math.max(
              0,
              Math.min(
                rect.left - editorRect.left + rect.width / 2 - 100, // Center horizontally
                editorRect.width - 200 // Don't go off the right edge
              )
            ),
          });
        }
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] p-4",
      },
    },
    immediatelyRender: false,
  });

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}" target="_blank">${linkUrl}</a>`)
        .run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }

    setLinkUrl("");
    setShowLinkInput(false);
    setShowToolbar(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  const handleToolbarAction = useCallback((action: () => void) => {
    action();
    // Keep toolbar visible after action
  }, []);

  // Handle toolbar animation
  useEffect(() => {
    if (showToolbar) {
      // Fade in
      setToolbarVisible(true);
    } else {
      // Fade out
      const timer = setTimeout(() => {
        setToolbarVisible(false);
      }, 150); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [showToolbar]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg bg-white relative",
        className
      )}
      ref={editorRef}
    >
      {/* Floating Toolbar - appears on text selection */}
      {toolbarVisible && (
        <div
          className={cn(
            "absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex gap-1",
            "transition-all duration-150 ease-out",
            showToolbar
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1"
          )}
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
        >
          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() =>
              handleToolbarAction(() =>
                editor.chain().focus().toggleBold().run()
              )
            }
            className="h-7 w-7 p-0"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() =>
              handleToolbarAction(() =>
                editor.chain().focus().toggleItalic().run()
              )
            }
            className="h-7 w-7 p-0"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="sm"
            onClick={() =>
              handleToolbarAction(() =>
                editor.chain().focus().toggleUnderline().run()
              )
            }
            className="h-7 w-7 p-0"
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "default" : "ghost"}
            size="sm"
            onClick={() =>
              handleToolbarAction(() =>
                editor.chain().focus().toggleStrike().run()
              )
            }
            className="h-7 w-7 p-0"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-7 bg-gray-200 mx-1" />

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-7 w-7 p-0"
            >
              <Palette className="h-3.5 w-3.5" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full mt-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 grid grid-cols-8 gap-0.5">
                {colorPalette.slice(0, 16).map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="h-7 w-7 p-0"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
            {showHighlightPicker && (
              <div className="absolute top-full mt-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 grid grid-cols-6 gap-0.5">
                {highlightColors.slice(0, 12).map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant={editor.isActive("link") ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (editor.isActive("link")) {
                  removeLink();
                } else {
                  setShowLinkInput(!showLinkInput);
                  setTimeout(() => linkInputRef.current?.focus(), 0);
                }
              }}
              className="h-7 w-7 p-0"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
            {showLinkInput && (
              <div className="absolute top-full mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex gap-2">
                <input
                  ref={linkInputRef}
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded w-48"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    } else if (e.key === "Escape") {
                      setShowLinkInput(false);
                      setLinkUrl("");
                    }
                  }}
                />
                <Button size="sm" onClick={addLink} disabled={!linkUrl}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[150px]"
        placeholder={placeholder}
      />
    </div>
  );
}
