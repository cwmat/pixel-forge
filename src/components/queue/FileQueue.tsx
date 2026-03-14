import { useImageStore } from "@/stores/image-store";
import { FileCard } from "./FileCard";

export function FileQueue() {
  const queue = useImageStore((s) => s.queue);

  if (queue.length === 0) return null;

  return (
    <div className="grid auto-rows-min grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {queue.map((item) => (
        <FileCard key={item.id} image={item} />
      ))}
    </div>
  );
}
