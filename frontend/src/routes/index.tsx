import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import App from "../app/App.jsx";

export const Route = createFileRoute("/")({
  ssr: false,
  component: () => <ClientOnly fallback={null}><App /></ClientOnly>,
});
