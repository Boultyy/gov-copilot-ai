import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/schemes")({
  component: Schemes,
});

function Schemes() {
  return <div>Schemes Page Placeholder</div>;
}
