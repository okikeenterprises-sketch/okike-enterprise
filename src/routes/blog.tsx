import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — OKIKE" },
      {
        name: "description",
        content: "Insights, tutorials, and stories from OKIKE.",
      },
      { property: "og:title", content: "Blog — OKIKE" },
      {
        property: "og:description",
        content: "Insights, tutorials, and stories from OKIKE.",
      },
    ],
  }),
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}
