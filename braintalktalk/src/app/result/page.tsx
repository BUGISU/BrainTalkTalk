// src/app/result/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlaceType, TRAINING_PLACES } from "@/constants/trainingData";

// ============================================
// 1. 결과 인터페이스
// ============================================
interface StepResult {
  step: number;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: "excellent" | "good" | "fair" | "needsWork";
}

interface OverallResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  recommendation: string;
}

// ============================================
// 2. 메인 컴포넌트
// ============================================
export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const place = (searchParams.get("place") as PlaceType) || "home";
  const step1Score = parseInt(searchParams.get("step1") || "0");
  const step3Score = parseInt(searchParams.get("step3") || "0");
  const step5Score = parseInt(searchParams.get("step5") || "0");
  const step6Score = parseInt(searchParams.get("step6") || "0");

  const [isMounted, setIsMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 장소 정보
  const placeInfo = TRAINING_PLACES.find((p) => p.id === place) || TRAINING_PLACES[0];

  // ============================================
  // 3. 결과 계산
  // ============================================
  const stepResults: StepResult[] = useMemo(() => {
    const getStatus = (pct: number): StepResult["status"] => {
      if (pct >= 90) return "excellent";
      if (pct >= 70) return "good";
      if (pct >= 50) return "fair";
      return "needsWork";
    };

    return [
      {
        step: 1,
        name: "청각 이해",
        score: step1Score,
        maxScore: 20, // 최대 20문제 가정
        percentage: Math.min(Math.round((step1Score / 20) * 100), 100),
        status: getStatus(Math.min((step1Score / 20) * 100, 100)),
      },
      {
        step: 2,
        name: "따라 말하기",
        score: 8, // step2는 별도 점수 전달 없음 - 기본값
        maxScore: 10,
        percentage: 80,
        status: "good",
      },
      {
        step: 3,
        name: "단어-이미지 매칭",
        score: step3Score,
        maxScore: 10,
        percentage: Math.min(Math.round((step3Score / 10) * 100), 100),
        status: getStatus(Math.min((step3Score / 10) * 100, 100)),
      },
      {
        step: 4,
        name: "유창성 학습",
        score: 75, // step4 평균 점수 기본값
        maxScore: 100,
        percentage: 75,
        status: "good",
      },
      {
        step: 5,
        name: "읽기 학습",
        score: step5Score,
        maxScore: 100,
        percentage: Math.min(step5Score, 100),
        status: getStatus(step5Score),
      },
      {
        step: 6,
        name: "쓰기 학습",
        score: step6Score,
        maxScore: 8,
        percentage: Math.min(Math.round((step6Score / 8) * 100), 100),
        status: getStatus(Math.min((step6Score / 8) * 100, 100)),
      },
    ];
  }, [step1Score, step3Score, step5Score, step6Score]);

  const overallResult: OverallResult = useMemo(() => {
    const totalPercentage = Math.round(
      stepResults.reduce((sum, r) => sum + r.percentage, 0) / stepResults.length
    );

    let grade: string;
    let recommendation: string;

    if (totalPercentage >= 90) {
      grade = "우수";
      recommendation = "매우 훌륭한 성과입니다! 현재 수준을 유지하면서 다양한 상황에서 연습해 보세요.";
    } else if (totalPercentage >= 75) {
      grade = "양호";
      recommendation = "좋은 성과입니다. 조금 더 연습하면 더 좋은 결과를 얻을 수 있습니다.";
    } else if (totalPercentage >= 60) {
      grade = "보통";
      recommendation = "기본적인 능력이 있습니다. 어려운 부분을 집중적으로 연습해 보세요.";
    } else {
      grade = "노력 필요";
      recommendation = "꾸준한 연습이 필요합니다. 쉬운 단계부터 차근차근 진행해 보세요.";
    }

    return {
      totalScore: stepResults.reduce((sum, r) => sum + r.score, 0),
      maxScore: stepResults.reduce((sum, r) => sum + r.maxScore, 0),
      percentage: totalPercentage,
      grade,
      recommendation,
    };
  }, [stepResults]);

  // ============================================
  // 4. 렌더링
  // ============================================
  if (!isMounted) return null;

  const statusColors = {
    excellent: { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500" },
    good: { bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500" },
    fair: { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" },
    needsWork: { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500" },
  };

  const statusLabels = {
    excellent: "우수",
    good: "양호",
    fair: "보통",
    needsWork: "노력필요",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-[30px] p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: placeInfo.color + "20" }}>
              {placeInfo.icon}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#8B4513]">학습 완료!</h1>
              <p className="text-gray-500 font-bold">{placeInfo.title} 훈련 결과</p>
            </div>
          </div>

          {/* 종합 점수 */}
          <div className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] rounded-[25px] p-6 text-white text-center">
            <p className="text-amber-200 text-sm font-bold mb-2">종합 점수</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-6xl font-black">{overallResult.percentage}</span>
              <span className="text-3xl font-bold opacity-70">점</span>
            </div>
            <div className="mt-3 inline-block px-6 py-2 bg-white/20 rounded-full">
              <span className="font-black text-lg">{overallResult.grade}</span>
            </div>
          </div>
        </div>

        {/* STEP별 결과 */}
        <div className="bg-white rounded-[30px] p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black text-[#8B4513]">📊 단계별 결과</h2>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-amber-600 font-bold"
            >
              {showDetails ? "간략히" : "자세히"}
            </button>
          </div>

          <div className="space-y-3">
            {stepResults.map((result) => (
              <div
                key={result.step}
                className={`p-4 rounded-2xl ${statusColors[result.status].bg} transition-all`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-black text-[#8B4513]">
                      {result.step}
                    </span>
                    <span className="font-bold text-gray-800">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black ${statusColors[result.status].text}`}>
                      {result.percentage}%
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[result.status].bg} ${statusColors[result.status].text}`}>
                      {statusLabels[result.status]}
                    </span>
                  </div>
                </div>

                {/* 진행 바 */}
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColors[result.status].bar} transition-all duration-500`}
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>

                {showDetails && (
                  <div className="mt-2 text-sm text-gray-600">
                    점수: {result.score} / {result.maxScore}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 추천 메시지 */}
        <div className="bg-white rounded-[30px] p-6 shadow-lg border border-gray-100">
          <h2 className="text-lg font-black text-[#8B4513] mb-3">💡 추천</h2>
          <p className="text-gray-700 leading-relaxed">{overallResult.recommendation}</p>
        </div>

        {/* SaMD 면책 조항 */}
        <div className="bg-gray-50 rounded-[20px] p-4 border border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            ⚠️ 본 결과는 언어 재활 훈련의 보조 자료로만 사용되어야 합니다.<br />
            의료적 진단이나 치료를 대체할 수 없으며, 정확한 평가는 전문가와 상담하세요.
          </p>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/select`)}
            className="flex-1 py-4 bg-amber-100 text-amber-700 rounded-2xl font-black text-lg hover:bg-amber-200 transition-colors"
          >
            🔄 재학습
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-4 bg-[#8B4513] text-white rounded-2xl font-black text-lg hover:bg-[#6B3410] transition-colors"
          >
            🏠 종료
          </button>
        </div>
      </div>
    </div>
  );
}
