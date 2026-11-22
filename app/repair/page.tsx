import type { Metadata } from "next";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";

export const metadata: Metadata = {
  title: "Bugsmith — Main Engineering Workspace",
  description:
    "Primary interactive workspace for Bugsmith Agentic Code Intelligence, Transformation, and Evaluation Platform.",
};

export default function RepairPage() {
  return <WorkspaceLayout />;
}
