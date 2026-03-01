"use client";

import { useState } from "react";
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
} from "@/hooks/useTaskTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ListChecks } from "lucide-react";

interface TaskTemplateEditorProps {
  classId: string;
}

export function TaskTemplateEditor({ classId }: TaskTemplateEditorProps) {
  const { data: templates, isLoading } = useTaskTemplates(classId);
  const createTemplate = useCreateTaskTemplate();
  const updateTemplate = useUpdateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();
  const [newTitle, setNewTitle] = useState("");

  function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    createTemplate.mutate({ classId, title });
    setNewTitle("");
  }

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5" />
          Session Task Templates
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Default templates are automatically added to new sessions. Changes do not affect existing sessions.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates && templates.length > 0 && (
          <div className="space-y-1">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5"
              >
                <Checkbox
                  checked={tpl.isDefault}
                  onCheckedChange={(checked) =>
                    updateTemplate.mutate({
                      classId,
                      templateId: tpl.id,
                      isDefault: !!checked,
                    })
                  }
                  title="Auto-add to new sessions"
                />
                <span className="flex-1 text-sm">{tpl.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    deleteTemplate.mutate({ classId, templateId: tpl.id })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New template task..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreate}
            disabled={!newTitle.trim() || createTemplate.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
