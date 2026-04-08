import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CalendarDays, Link as LinkIcon } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { lazy, Suspense } from "react";

const PostsTab = lazy(() => import("@/components/social/PostsTabContent"));
const CalendarTab = lazy(() => import("@/components/social/CalendarTabContent"));
const AccountsTab = lazy(() => import("@/components/social/AccountsTabContent"));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function SocialPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "posts";
  const { isAdmin } = usePermissions();

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social</h1>
          <p className="text-muted-foreground">Gerencie suas publicações no Facebook e Instagram</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="posts" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendário
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="accounts" className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" />
                Contas
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts">
            <Suspense fallback={<TabLoader />}>
              <PostsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="calendar">
            <Suspense fallback={<TabLoader />}>
              <CalendarTab />
            </Suspense>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="accounts">
              <Suspense fallback={<TabLoader />}>
                <AccountsTab />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
