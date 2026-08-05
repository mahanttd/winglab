import type { Metadata } from "next";
import { CompareClient } from "@/components/design/CompareClient";
import { PageFooter } from "@/components/PageFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Compare designs",
  description: "Compare locally saved WingLab studies without hiding mission tradeoffs.",
};

export default function ComparePage() {
  return (
    <>
      <SiteHeader />
      <CompareClient />
      <PageFooter />
    </>
  );
}

