import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { useEffect, useCallback } from "react"
import { CheckSquare, Bold, Italic, Code } from "lucide-react"

interface TiptapEditorProps {
	content: string
	onChange?: (content: string) => void
	onBlur?: () => void
	placeholder?: string
	className?: string
}

export function TiptapEditor({
	content,
	onChange,
	onBlur,
	placeholder = "Notes...",
	className = "",
}: TiptapEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
				},
			}),
			TaskList.configure({
				HTMLAttributes: {
					class: "task-list",
				},
			}),
			TaskItem.configure({
				nested: true,
				HTMLAttributes: {
					class: "task-item",
				},
			}),
		],
		content: content || "",
		editorProps: {
			attributes: {
				class: `prose prose-invert prose-sm max-w-none focus:outline-none min-h-full ${className}`,
			},
		},
		onUpdate: ({ editor }) => {
			onChange?.(editor.getHTML())
		},
		onBlur: () => {
			onBlur?.()
		},
	})

	// Update editor content when prop changes externally
	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content || "")
		}
	}, [content, editor])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				editor?.commands.blur()
			}
		},
		[editor],
	)

	if (!editor) {
		return null
	}

	return (
		<div
			className="tiptap-editor-wrapper h-full overflow-y-auto"
			onKeyDown={handleKeyDown}
		>
			<BubbleMenu editor={editor} className="bubble-menu">
				<button
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={`bubble-menu-button ${
						editor.isActive("bold") ? "is-active" : ""
					}`}
					title="Bold"
				>
					<Bold className="w-4 h-4" />
				</button>
				<button
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={`bubble-menu-button ${
						editor.isActive("italic") ? "is-active" : ""
					}`}
					title="Italic"
				>
					<Italic className="w-4 h-4" />
				</button>
				<button
					onClick={() => editor.chain().focus().toggleCode().run()}
					className={`bubble-menu-button ${
						editor.isActive("code") ? "is-active" : ""
					}`}
					title="Code"
				>
					<Code className="w-4 h-4" />
				</button>
				<div className="bubble-menu-divider" />
				<button
					onClick={() => editor.chain().focus().toggleTaskList().run()}
					className={`bubble-menu-button ${
						editor.isActive("taskList") ? "is-active" : ""
					}`}
					title="Task List"
				>
					<CheckSquare className="w-4 h-4" />
				</button>
			</BubbleMenu>
			<EditorContent editor={editor} className="h-full" />
			{editor.isEmpty && (
				<div className="absolute top-0 left-0 text-[#555] pointer-events-none select-none">
					{placeholder}
				</div>
			)}
			<style>{`
				.tiptap-editor-wrapper {
					position: relative;
				}
				
				.tiptap-editor-wrapper .ProseMirror {
					min-height: 100%;
					padding: 0;
					color: #888;
					font-size: 0.875rem;
					line-height: 1.5;
				}
				
				.tiptap-editor-wrapper .ProseMirror:focus {
					outline: none;
				}
				
				.tiptap-editor-wrapper .ProseMirror p {
					margin: 0 0 0.5rem 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror p:last-child {
					margin-bottom: 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul,
				.tiptap-editor-wrapper .ProseMirror ol {
					padding-left: 1.25rem;
					margin: 0 0 0.5rem 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] {
					list-style: none;
					padding-left: 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li {
					display: flex;
					align-items: flex-start;
					gap: 0.5rem;
					margin-bottom: 0.25rem;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li > label {
					flex-shrink: 0;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-top: 0.125rem;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
					appearance: none;
					-webkit-appearance: none;
					width: 1rem;
					height: 1rem;
					border: 1px solid #555;
					border-radius: 0.25rem;
					background: transparent;
					cursor: pointer;
					position: relative;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"]:checked {
					background: #22c55e;
					border-color: #22c55e;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"]:checked::after {
					content: "✓";
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					color: white;
					font-size: 0.625rem;
					font-weight: bold;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"]:hover {
					border-color: #888;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li > div {
					flex: 1;
					min-width: 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
					text-decoration: line-through;
					color: #555;
				}
				
				/* Nested task lists */
				.tiptap-editor-wrapper .ProseMirror ul[data-type="taskList"] ul[data-type="taskList"] {
					margin-left: 1.25rem;
					margin-top: 0.25rem;
				}
				
				.tiptap-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
					content: attr(data-placeholder);
					float: left;
					color: #555;
					pointer-events: none;
					height: 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror code {
					background: #333;
					border-radius: 0.25rem;
					padding: 0.125rem 0.25rem;
					font-family: monospace;
				}
				
				.tiptap-editor-wrapper .ProseMirror pre {
					background: #1a1a1a;
					border-radius: 0.375rem;
					padding: 0.75rem;
					margin: 0.5rem 0;
					overflow-x: auto;
				}
				
				.tiptap-editor-wrapper .ProseMirror pre code {
					background: none;
					padding: 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror blockquote {
					border-left: 3px solid #555;
					padding-left: 1rem;
					margin: 0.5rem 0;
					color: #666;
				}
				
				.tiptap-editor-wrapper .ProseMirror hr {
					border: none;
					border-top: 1px solid #333;
					margin: 1rem 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror strong {
					color: #e6e6e6;
				}
				
				.tiptap-editor-wrapper .ProseMirror h1,
				.tiptap-editor-wrapper .ProseMirror h2,
				.tiptap-editor-wrapper .ProseMirror h3,
				.tiptap-editor-wrapper .ProseMirror h4,
				.tiptap-editor-wrapper .ProseMirror h5,
				.tiptap-editor-wrapper .ProseMirror h6 {
					color: #e6e6e6;
					margin: 1rem 0 0.5rem 0;
				}
				
				.tiptap-editor-wrapper .ProseMirror h1:first-child,
				.tiptap-editor-wrapper .ProseMirror h2:first-child,
				.tiptap-editor-wrapper .ProseMirror h3:first-child {
					margin-top: 0;
				}
				
				/* Bubble Menu Styles */
				.bubble-menu {
					display: flex;
					align-items: center;
					gap: 2px;
					background: #2a2a2a;
					border: 1px solid #444;
					border-radius: 6px;
					padding: 4px;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
				}
				
				.bubble-menu-button {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 28px;
					height: 28px;
					border: none;
					background: transparent;
					color: #888;
					border-radius: 4px;
					cursor: pointer;
					transition: all 0.15s ease;
				}
				
				.bubble-menu-button:hover {
					background: #333;
					color: #e6e6e6;
				}
				
				.bubble-menu-button.is-active {
					background: #444;
					color: #22c55e;
				}
				
				.bubble-menu-divider {
					width: 1px;
					height: 20px;
					background: #444;
					margin: 0 4px;
				}
			`}</style>
		</div>
	)
}
