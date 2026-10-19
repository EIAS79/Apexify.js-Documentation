import type { Metadata } from "next";
import WorkspaceApp from "@/features/apex-workspace/WorkspaceApp";
export const metadata: Metadata = {
  title: "Workspace — Apexify.js",
  description:
    "Create graphics with a connected visual canvas, code, graph, and real Apexify render outputs.",
  alternates: { canonical: "/workspace" },
};
export default function WorkspacePage() {
  return <WorkspaceApp />;
}
