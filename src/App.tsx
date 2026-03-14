import { MainLayout } from "@/components/layout/MainLayout";
import { DropZone } from "@/components/input/DropZone";
import { Workspace } from "@/components/Workspace";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useImageStore } from "@/stores/image-store";

export default function App() {
  const queueLength = useImageStore((s) => s.queue.length);

  return (
    <MainLayout>
      <ErrorBoundary fallbackLabel="Application error">
        {queueLength === 0 ? <DropZone /> : <Workspace />}
      </ErrorBoundary>
    </MainLayout>
  );
}
