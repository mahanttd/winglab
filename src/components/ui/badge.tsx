import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "cyan" | "green" | "amber" | "red";
}) {
  return <span className={cn("badge", `badge-${tone}`, className)} {...props} />;
}

