import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";

export const metadata: Metadata = {
  title: "Simulator",
  description: "Define a wing and operating condition, then inspect preliminary aerodynamic estimates.",
};

export default function SimulatorPage() {
  return (
    <>
      <SiteHeader simulator />
      <SimulatorClient />
    </>
  );
}

