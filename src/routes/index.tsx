import { createFileRoute } from "@tanstack/react-router";
import { LcuConsole } from "@/components/lcu-console";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LCU-01 Monitoring Console | Antenna System Health" },
      {
        name: "description",
        content: "Secure operator access to the LCU-01 antenna monitoring console and simulated system health readings.",
      },
      { property: "og:title", content: "LCU-01 Monitoring Console | Antenna System Health" },
      {
        property: "og:description",
        content: "Secure operator access to LCU-01 monitoring, antenna status, hardware, communications, faults, and event logs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <LcuConsole />;
}
