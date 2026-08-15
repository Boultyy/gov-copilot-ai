import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/copilot")({
  component: Copilot,
});

function Copilot() {
  return <div>Main Copilot Experience Placeholder</div>;
}
