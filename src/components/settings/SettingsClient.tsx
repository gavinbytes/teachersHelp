"use client";

import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function SettingsClient() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [leadDays, setLeadDays] = useState(3);

  useEffect(() => {
    if (settings?.lessonPlanLeadDays !== undefined) {
      setLeadDays(settings.lessonPlanLeadDays);
    }
  }, [settings]);

  function handleSave() {
    updateSettings.mutate({ lessonPlanLeadDays: leadDays });
  }

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Task Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leadDays">Lesson plan lead days</Label>
            <p className="text-sm text-muted-foreground">
              How many days before a class session to auto-generate a &quot;Plan lesson&quot; task.
            </p>
            <div className="flex items-center gap-3">
              <Input
                id="leadDays"
                type="number"
                min={1}
                max={14}
                value={leadDays}
                onChange={(e) => setLeadDays(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
