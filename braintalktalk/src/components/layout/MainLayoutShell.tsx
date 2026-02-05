// src/components/layout/MainLayoutShell.tsx
"use client";

import React from "react";
import SafetyDisclaimer from "./SafetyDisclaimer";

interface MainLayoutShellProps {
  content: React.ReactNode;
  monitoring?: React.ReactNode; // 선택 사항으로 변경
  dashboard?: React.ReactNode; // 선택 사항으로 변경
}

export default function MainLayoutShell({
  content,
  monitoring,
  dashboard,
}: MainLayoutShellProps) {
  // 모니터링 요소가 하나라도 있는지 확인
  const hasSidebar = monitoring || dashboard;

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] p-4 md:p-8 flex justify-center items-center">
      <div className="w-full max-w-[1600px] flex flex-col gap-6">
        {/* 🔹 그리드 로직 수정: 사이드바가 있을 때만 2컬럼, 없으면 1컬럼 중앙 정렬 */}
        <div
          className={`grid gap-6 ${
            hasSidebar
              ? "grid-cols-1 lg:grid-cols-[1fr_420px]"
              : "grid-cols-1 max-w-[1100px] mx-auto w-full"
          }`}
        >
          {/* 좌측(메인 콘텐츠): 사이드바가 없으면 자동으로 중앙에 위치 */}
          <section
            className={`bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 min-h-[700px] flex flex-col ${
              !hasSidebar ? "items-center justify-center text-center" : ""
            }`}
          >
            {content}
          </section>

          {/* 우측(사이드바): 데이터가 있을 때만 렌더링 */}
          {hasSidebar && (
            <aside className="flex flex-col gap-6 min-w-0">
              {monitoring}
              {dashboard}
            </aside>
          )}
        </div>

        <SafetyDisclaimer />
      </div>
    </div>
  );
}
