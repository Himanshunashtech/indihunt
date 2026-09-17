import Navbar from "@/components/Navbar";
import { CircularLoader } from "@/components/CircularLoader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-[72px] sm:pt-[78px]">
      <Navbar />
      <main className="flex-1 w-full min-h-[calc(100vh-84px)] flex items-center justify-center">
        <CircularLoader label="Loading product details..." size="lg" center={false} />
      </main>
    </div>
  );
}