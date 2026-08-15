import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/applications")({
  component: Applications,
});

function Applications() {
  return <div>Application Tracker Placeholder</div>;
}
