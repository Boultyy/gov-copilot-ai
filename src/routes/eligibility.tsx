import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/eligibility")({
  component: Eligibility,
});

function Eligibility() {
  return <div>Eligibility Checker Placeholder</div>;
}
