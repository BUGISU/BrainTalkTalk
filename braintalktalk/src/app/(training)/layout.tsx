// src/app/(training)/layout.tsx
"use client";

import React from "react";
import MainLayoutShell from "@/components/layout/MainLayoutShell";

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayoutShell
      content={children}
      // 🔹 레이아웃에서 고정적으로 넣었던 요소를 제거합니다.
      monitoring={null}
      dashboard={null}
    />
  );
}
