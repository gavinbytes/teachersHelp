"use client";

import { useState, useRef } from "react";
import { useAddStudent } from "@/hooks/useStudents";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

interface QuickStudentEntryProps {
  classId: string;
}

export function QuickStudentEntry({ classId }: QuickStudentEntryProps) {
  const [value, setValue] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addStudent = useAddStudent();

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !value.trim()) return;
    e.preventDefault();

    setValidationError("");

    try {
      await addStudent.mutateAsync({ classId, student_name: value.trim() });
      setValue("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
      inputRef.current?.focus();
    } catch {
      // error handled by hook toast
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (validationError) setValidationError("");
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type student name and press Enter"
        disabled={addStudent.isPending}
        autoFocus
        className={showSuccess ? "border-green-500 ring-1 ring-green-500" : ""}
      />
      {showSuccess && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
          <Check className="h-4 w-4" />
        </div>
      )}
      {validationError && (
        <p className="mt-1 text-xs text-red-500">{validationError}</p>
      )}
    </div>
  );
}
