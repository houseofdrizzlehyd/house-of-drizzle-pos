import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 font-semibold text-[#3b2418] shadow-xl">
        <LoaderCircle className="animate-spin" size={22} />
        Loading...
      </div>
    </div>
  );
}
