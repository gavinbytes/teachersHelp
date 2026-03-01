"use client";

import { use } from "react";
import { useClass } from "@/hooks/useClasses";
import { GradebookClient } from "@/components/gradebook/GradebookClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GradebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: cls } = useClass(id);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/classes/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gradebook</h1>
          {cls && (
            <p className="text-sm text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ backgroundColor: cls.color }} />
              {cls.name}
            </p>
          )}
        </div>
      </div>
      <GradebookClient classId={id} />
    </div>
  );
}
