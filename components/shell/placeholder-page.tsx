"use client";

import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/use-ui-store";

/**
 * Temporary placeholder for feature pages. Feature builders replace each
 * route's page.tsx with the real implementation — no store changes needed.
 */
export function PlaceholderPage({ title, hint }: { title: string; hint: string }) {
  const router = useRouter();
  const setActiveNav = useUIStore((s) => s.setActiveNav);
  return (
    <div className="mx-auto max-w-2xl pt-10">
      <EmptyState
        icon={Hammer}
        title={`${title} — coming soon`}
        description={hint}
        action={
          <Button
            onClick={() => {
              setActiveNav("home");
              router.push("/home");
            }}
          >
            Back to Home
          </Button>
        }
      />
    </div>
  );
}
