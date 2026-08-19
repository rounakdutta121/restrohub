"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { ReadOnlyNotice } from "@/components/brand/role-badge";
import { toast } from "sonner";

interface Step { title: string; description: string; }

export default function ChecklistEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { organization } = useOrganization();
  const { can } = usePermissions();
  const canEdit = can("manageChecklists");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("prep");
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organization) return;
    fetch(`/api/workspaces/${organization.id}/sops/${id}`)
      .then((r) => r.json())
      .then((c) => {
        setTitle(c.title);
        setDescription(c.description || "");
        setType(c.type || "prep");
        setSteps(c.steps || []);
      });
  }, [organization, id]);

  function updateStep(index: number, field: keyof Step, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  async function save() {
    if (!organization) return;
    setSaving(true);
    const res = await fetch(`/api/workspaces/${organization.id}/sops/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type, steps }),
    });
    setSaving(false);
    toast[res.ok ? "success" : "error"](res.ok ? "Saved" : "Failed to save");
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard/checklists")}>&larr; Back</Button>
        {canEdit && (
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        )}
      </div>
      {!canEdit && <ReadOnlyNotice message="Only managers can edit checklist steps." />}
      <Input className="text-xl font-bold border-0 px-0" value={title} onChange={(e) => setTitle(e.target.value)} readOnly={!canEdit} />
      <select className="border rounded-md px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)} disabled={!canEdit}>
        {["prep", "maintenance", "opening", "closing"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} readOnly={!canEdit} />
      <div className="space-y-3">
        <h3 className="font-semibold">Steps</h3>
        {steps.map((step, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                <Input value={step.title} onChange={(e) => updateStep(i, "title", e.target.value)} placeholder="Step title" readOnly={!canEdit} />
                {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => setSteps((p) => p.filter((_, j) => j !== i))}>Remove</Button>
                )}
              </div>
              <Textarea value={step.description} onChange={(e) => updateStep(i, "description", e.target.value)} rows={2} className="ml-8" readOnly={!canEdit} />
            </CardContent>
          </Card>
        ))}
        {canEdit && (
        <Button variant="outline" onClick={() => setSteps((p) => [...p, { title: "", description: "" }])}>+ Add Step</Button>
        )}
      </div>
    </div>
  );
}
