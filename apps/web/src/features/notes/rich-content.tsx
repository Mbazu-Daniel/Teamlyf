import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
const prefix = "teamlyf-rich-v1:";

export function noteDocument(content: string): JSONContent {
  if (content.startsWith(prefix)) {
    try {
      const value = JSON.parse(content.slice(prefix.length));
      if (value?.type === "doc") return value;
    } catch {
      /* Legacy text stays readable. */
    }
  }
  return {
    type: "doc",
    content: content.split("\n").map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}
export function noteText(content: string): string {
  const walk = (node: JSONContent): string =>
    node.text ?? node.content?.map(walk).join(node.type === "doc" ? "\n" : " ") ?? "";
  return walk(noteDocument(content));
}

export function RichNoteEditor({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: noteDocument(initial),
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(prefix + JSON.stringify(current.getJSON())),
    editorProps: {
      attributes: {
        class:
          "min-h-[45vh] p-5 text-sm leading-7 outline-none [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_a]:underline",
        "aria-label": "Note content",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });
  if (!editor) return <p className="p-5 text-sm">Loading editor…</p>;
  const tools = [
    {
      label: "Bold",
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Heading",
      active: editor.isActive("heading"),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bullet list",
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Quote",
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    { label: "Undo", active: false, run: () => editor.chain().focus().undo().run() },
    { label: "Redo", active: false, run: () => editor.chain().focus().redo().run() },
  ];
  return (
    <div className="overflow-hidden rounded-xl border">
      <div aria-label="Text formatting" className="flex flex-wrap gap-1 border-b bg-muted/25 p-2">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            aria-pressed={tool.active}
            onClick={tool.run}
            className={`rounded-lg px-3 py-2 text-xs ${tool.active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {tool.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
