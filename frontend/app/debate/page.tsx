"use client";

import { DebateSetupForm } from "@/components/debate/debate-setup-form";

export default function DebateSetupPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Setup Debate</h1>
        <p className="text-muted-foreground">
          Configure and start a new debate session
        </p>
      </div>

      <DebateSetupForm />
    </div>
  );
}
