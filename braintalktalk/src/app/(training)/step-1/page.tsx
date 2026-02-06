import { Suspense } from "react";
import Step1Client from "./Step1Client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center h-screen bg-white">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-bold text-[#8B4513]">로딩 중...</p>
          </div>
        </div>
      }
    >
      <Step1Client />
    </Suspense>
  );
}
