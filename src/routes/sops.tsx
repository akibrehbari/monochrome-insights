import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useStore, type SOP, type Role } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/sops")({
  component: SOPsPage,
});

const uid = () => Math.random().toString(36).slice(2, 9);
const CATEGORIES = ["Content", "HR", "Operations", "Finance", "Security", "General"];
const ALL_ROLES: Role[] = ["admin", "hr", "employee"];

function SOPsPage() {
  return (
    <RoleGuard allowed={["admin", "hr", "employee"]}>
      <SOPsContent />
    </RoleGuard>
  );
}

function SOPsContent() {
  const { user } = useAuth();
  const { sops, setSOPs } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<SOP | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("All");

  const isAdmin = user?.role === "admin";

  // Filter SOPs by role
  const visible = sops.filter((s) =>
    user ? s.assignedRoles.includes(user.role) : false
  );

  const categories = ["All", ...Array.from(new Set(visible.map((s) => s.category)))];
  const filtered = filter === "All" ? visible : visible.filter((s) => s.category === filter);

  function save(sop: Omit<SOP, "id" | "createdAt">) {
    if (editing) {
      setSOPs((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...sop } : s));
      setEditing(null);
    } else {
      setSOPs((prev) => [...prev, { ...sop, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }]);
      setCreating(false);
    }
  }

  function del(id: string) {
    if (confirm("Delete this SOP?")) setSOPs((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="SOPs"
        subtitle={`${filtered.length} procedure${filtered.length !== 1 ? "s" : ""}`}
        actions={
          isAdmin && (
            <button
              onClick={() => { setCreating(true); setEditing(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> New SOP
            </button>
          )
        }
      />

      <div className="px-8 py-6">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                filter === c
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground py-12 text-center">
            No SOPs found for your role.
          </div>
        )}

        {/* SOP list */}
        <div className="space-y-2">
          {filtered.map((sop) => (
            <div key={sop.id} className="border border-border rounded">
              {/* Header row */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setExpanded(expanded === sop.id ? null : sop.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {expanded === sop.id
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{sop.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                      <span>{sop.category}</span>
                      <span>·</span>
                      <span>{sop.createdAt}</span>
                      {isAdmin && (
                        <>
                          <span>·</span>
                          <span>{sop.assignedRoles.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditing(sop); setCreating(false); setExpanded(null); }}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => del(sop.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {expanded === sop.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground/90">
                      {sop.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit modal */}
      {(creating || editing) && (
        <SOPModal
          initial={editing ?? undefined}
          onSave={save}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function SOPModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: SOP;
  onSave: (sop: Omit<SOP, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [roles, setRoles] = useState<Role[]>(initial?.assignedRoles ?? ["employee"]);

  function toggleRole(r: Role) {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || roles.length === 0) return;
    onSave({ title, content, category, assignedRoles: roles });
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{initial ? "Edit SOP" : "New SOP"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="SOP title"
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Visible to</label>
              <div className="flex gap-2">
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors capitalize ${
                      roles.includes(r)
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Content (Markdown supported)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={14}
              placeholder="Write the SOP content here..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground font-mono resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90"
            >
              {initial ? "Save Changes" : "Create SOP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
