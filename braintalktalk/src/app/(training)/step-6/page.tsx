// src/app/(training)/step-6/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlaceType } from "@/constants/trainingData";

// ============================================
// 1. 쓰기 문제 데이터
// ============================================
const WRITING_WORDS: Record<PlaceType, Array<{
  id: number;
  hint: string;        // 힌트 (이미지 또는 설명)
  emoji: string;       // 이모지
  answer: string;      // 정답
  category: string;    // 카테고리
}>> = {
  home: [
    { id: 1, hint: "물을 끓이는 도구", emoji: "🍳", answer: "냄비", category: "주방" },
    { id: 2, hint: "잠을 자는 가구", emoji: "🛏️", answer: "침대", category: "가구" },
    { id: 3, hint: "옷을 보관하는 곳", emoji: "🚪", answer: "옷장", category: "가구" },
    { id: 4, hint: "문을 여는 도구", emoji: "🔑", answer: "열쇠", category: "생활" },
    { id: 5, hint: "얼굴을 보는 물건", emoji: "🪞", answer: "거울", category: "생활" },
    { id: 6, hint: "추울 때 덮는 것", emoji: "🛏️", answer: "이불", category: "침구" },
    { id: 7, hint: "TV 채널을 바꾸는 것", emoji: "📱", answer: "리모컨", category: "가전" },
    { id: 8, hint: "빨래를 하는 기계", emoji: "🧺", answer: "세탁기", category: "가전" },
  ],
  hospital: [
    { id: 1, hint: "아플 때 먹는 것", emoji: "💊", answer: "약", category: "의료" },
    { id: 2, hint: "체온을 재는 도구", emoji: "🌡️", answer: "체온계", category: "의료" },
    { id: 3, hint: "환자를 치료하는 사람", emoji: "👨‍⚕️", answer: "의사", category: "직업" },
    { id: 4, hint: "주사를 놓는 도구", emoji: "💉", answer: "주사기", category: "의료" },
    { id: 5, hint: "상처에 붙이는 것", emoji: "🩹", answer: "반창고", category: "의료" },
    { id: 6, hint: "환자를 옮기는 의자", emoji: "🦽", answer: "휠체어", category: "의료" },
    { id: 7, hint: "코와 입을 가리는 것", emoji: "😷", answer: "마스크", category: "위생" },
    { id: 8, hint: "의사가 쓰는 처방", emoji: "📋", answer: "처방전", category: "서류" },
  ],
  cafe: [
    { id: 1, hint: "따뜻한 음료", emoji: "☕", answer: "커피", category: "음료" },
    { id: 2, hint: "음료를 담는 용기", emoji: "🥛", answer: "컵", category: "용기" },
    { id: 3, hint: "빵과 크림으로 만든 것", emoji: "🍰", answer: "케이크", category: "디저트" },
    { id: 4, hint: "음료에 꽂는 것", emoji: "🥤", answer: "빨대", category: "용품" },
    { id: 5, hint: "주문 후 받는 것", emoji: "🔔", answer: "진동벨", category: "용품" },
    { id: 6, hint: "앉는 가구", emoji: "🪑", answer: "의자", category: "가구" },
    { id: 7, hint: "메뉴를 보는 것", emoji: "📋", answer: "메뉴판", category: "용품" },
    { id: 8, hint: "결제 후 받는 것", emoji: "🧾", answer: "영수증", category: "서류" },
  ],
  bank: [
    { id: 1, hint: "돈을 넣는 책", emoji: "📕", answer: "통장", category: "금융" },
    { id: 2, hint: "결제할 때 쓰는 것", emoji: "💳", answer: "카드", category: "금융" },
    { id: 3, hint: "현금을 찾는 기계", emoji: "🏧", answer: "ATM", category: "기기" },
    { id: 4, hint: "기다릴 때 받는 것", emoji: "🎫", answer: "번호표", category: "서류" },
    { id: 5, hint: "귀중품 보관함", emoji: "🔐", answer: "금고", category: "보관" },
    { id: 6, hint: "서류에 찍는 것", emoji: "🔴", answer: "도장", category: "문구" },
    { id: 7, hint: "신원을 확인하는 것", emoji: "🪪", answer: "신분증", category: "서류" },
    { id: 8, hint: "숫자를 계산하는 것", emoji: "🧮", answer: "계산기", category: "기기" },
  ],
  park: [
    { id: 1, hint: "키가 크고 잎이 있는 것", emoji: "🌳", answer: "나무", category: "자연" },
    { id: 2, hint: "예쁜 색의 식물", emoji: "🌸", answer: "꽃", category: "자연" },
    { id: 3, hint: "앉아서 쉬는 곳", emoji: "🪑", answer: "벤치", category: "시설" },
    { id: 4, hint: "두 바퀴로 타는 것", emoji: "🚲", answer: "자전거", category: "이동" },
    { id: 5, hint: "물이 솟아오르는 곳", emoji: "⛲", answer: "분수대", category: "시설" },
    { id: 6, hint: "하늘을 나는 곤충", emoji: "🦋", answer: "나비", category: "동물" },
    { id: 7, hint: "공중에 띄우는 것", emoji: "🪁", answer: "연", category: "놀이" },
    { id: 8, hint: "낮에 빛나는 것", emoji: "☀️", answer: "해", category: "자연" },
  ],
  mart: [
    { id: 1, hint: "빨간 과일", emoji: "🍎", answer: "사과", category: "과일" },
    { id: 2, hint: "물건을 담는 바구니", emoji: "🛒", answer: "카트", category: "용품" },
    { id: 3, hint: "하얀 음료", emoji: "🥛", answer: "우유", category: "음료" },
    { id: 4, hint: "주황색 채소", emoji: "🥕", answer: "당근", category: "채소" },
    { id: 5, hint: "돈을 내는 곳", emoji: "🏪", answer: "계산대", category: "시설" },
    { id: 6, hint: "노란 과일", emoji: "🍌", answer: "바나나", category: "과일" },
    { id: 7, hint: "둥근 알", emoji: "🥚", answer: "계란", category: "식품" },
    { id: 8, hint: "돈을 넣는 곳", emoji: "👛", answer: "지갑", category: "용품" },
  ],
};

// ============================================
// 2. 쓰기 평가 인터페이스
// ============================================
interface WritingResult {
  wordId: number;
  userInput: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  accuracy: number;
}

// ============================================
// 3. 메인 컴포넌트
// ============================================
export default function Step6Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const place = (searchParams.get("place") as PlaceType) || "home";
  const step5Score = searchParams.get("step5") || "0";

  // 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [phase, setPhase] = useState<"writing" | "review">("writing");
  const [isMounted, setIsMounted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showHint, setShowHint] = useState(false);

  // 결과
  const [writingResults, setWritingResults] = useState<WritingResult[]>([]);
  const [currentResult, setCurrentResult] = useState<WritingResult | null>(null);

  // Ref
  const inputRef = useRef<HTMLInputElement>(null);

  // 단어 데이터
  const words = useMemo(() => WRITING_WORDS[place] || WRITING_WORDS.home, [place]);
  const currentWord = words[currentIndex];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (phase === "writing" && inputRef.current) {
      inputRef.current.focus();
    }
    setStartTime(Date.now());
  }, [currentIndex, phase]);

  // ============================================
  // 4. 정답 확인
  // ============================================
  const checkAnswer = useCallback(() => {
    const responseTime = (Date.now() - startTime) / 1000;
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedAnswer = currentWord.answer.toLowerCase();

    // 정확도 계산 (레벤슈타인 거리 기반)
    const distance = levenshteinDistance(normalizedInput, normalizedAnswer);
    const maxLen = Math.max(normalizedInput.length, normalizedAnswer.length);
    const accuracy = maxLen > 0 ? Math.round((1 - distance / maxLen) * 100) : 0;
    const isCorrect = normalizedInput === normalizedAnswer;

    const result: WritingResult = {
      wordId: currentWord.id,
      userInput: userInput.trim(),
      correctAnswer: currentWord.answer,
      isCorrect,
      responseTime: Math.round(responseTime * 10) / 10,
      accuracy,
    };

    setCurrentResult(result);
    setWritingResults((prev) => [...prev, result]);
    setPhase("review");
  }, [userInput, currentWord, startTime]);

  // 레벤슈타인 거리 계산
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[b.length][a.length];
  };

  // ============================================
  // 5. 다음 / 완료
  // ============================================
  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput("");
      setPhase("writing");
      setCurrentResult(null);
      setShowHint(false);
    } else {
      finishTraining();
    }
  };

  const finishTraining = () => {
    const correctCount = writingResults.filter((r) => r.isCorrect).length;
    const avgAccuracy = writingResults.length > 0
      ? Math.round(writingResults.reduce((a, b) => a + b.accuracy, 0) / writingResults.length)
      : 0;

    // 결과 저장
    const sessionData = {
      place,
      step5Score: parseInt(step5Score),
      step6Score: correctCount,
      step6Accuracy: avgAccuracy,
      writingResults,
      completedAt: Date.now(),
    };

    localStorage.setItem("btt.step6Session", JSON.stringify(sessionData));

    router.push(`/result?place=${place}&step5=${step5Score}&step6=${correctCount}`);
  };

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userInput.trim()) {
      checkAnswer();
    }
  };

  // ============================================
  // 6. 렌더링
  // ============================================
  if (!isMounted || !currentWord) return null;

  const correctCount = writingResults.filter((r) => r.isCorrect).length;

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden text-black font-sans">
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
        <div className="text-left">
          <span className="text-[#DAA520] font-black text-[10px] tracking-widest uppercase block mb-0.5">
            Step 06 • {place.toUpperCase()}
          </span>
          <h2 className="text-xl font-black text-[#8B4513] tracking-tighter">
            쓰기 학습
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
            {currentWord.category}
          </div>
          <div className="bg-[#F8F9FA] px-4 py-1.5 rounded-2xl font-black text-lg text-[#DAA520]">
            {currentIndex + 1} / {words.length}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {phase === "writing" ? (
          <>
            {/* 이모지 힌트 */}
            <div className="text-center space-y-4">
              <div className="w-40 h-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-[40px] flex items-center justify-center shadow-lg border-4 border-amber-200">
                <span className="text-8xl">{currentWord.emoji}</span>
              </div>

              {/* 힌트 토글 */}
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-gray-400 hover:text-amber-600 transition-colors"
              >
                {showHint ? "🔒 힌트 숨기기" : "💡 힌트 보기"}
              </button>

              {showHint && (
                <div className="bg-amber-50 px-6 py-2 rounded-xl inline-block">
                  <p className="text-amber-700 font-bold">{currentWord.hint}</p>
                </div>
              )}
            </div>

            {/* 입력 필드 */}
            <div className="w-full max-w-md space-y-4">
              <div className="text-center">
                <p className="text-gray-500 font-bold mb-2">위 그림의 이름을 입력하세요</p>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="여기에 입력..."
                className="w-full px-8 py-6 text-3xl font-black text-center border-4 border-amber-200 rounded-[20px] focus:outline-none focus:border-[#DAA520] focus:ring-4 focus:ring-amber-100 transition-all"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />

              <button
                onClick={checkAnswer}
                disabled={!userInput.trim()}
                className={`w-full py-4 rounded-2xl font-black text-xl transition-all ${
                  userInput.trim()
                    ? "bg-[#DAA520] text-white hover:bg-[#B8860B] active:scale-95"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                ✅ 확인
              </button>
            </div>

            {/* 점수 표시 */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                현재 점수: <span className="font-black text-amber-600">{correctCount}</span> / {currentIndex}
              </p>
            </div>
          </>
        ) : (
          /* 결과 화면 */
          currentResult && (
            <div className="w-full max-w-md space-y-6 text-center">
              {/* 정답/오답 표시 */}
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                currentResult.isCorrect ? "bg-green-100" : "bg-red-100"
              }`}>
                <span className="text-7xl">
                  {currentResult.isCorrect ? "⭕" : "❌"}
                </span>
              </div>

              {/* 결과 카드 */}
              <div className="bg-white border-4 border-gray-100 rounded-[30px] p-6 shadow-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">입력한 답</p>
                    <p className={`text-2xl font-black ${
                      currentResult.isCorrect ? "text-green-600" : "text-red-600"
                    }`}>
                      {currentResult.userInput || "(없음)"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-xs text-amber-600">정답</p>
                    <p className="text-2xl font-black text-amber-700">
                      {currentResult.correctAnswer}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">정확도</p>
                    <p className="text-2xl font-black text-purple-600">
                      {currentResult.accuracy}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">소요 시간</p>
                    <p className="text-2xl font-black text-blue-600">
                      {currentResult.responseTime}초
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-4 bg-[#DAA520] text-white rounded-2xl font-black text-xl hover:bg-[#B8860B] transition-colors"
              >
                {currentIndex < words.length - 1 ? "다음 문제" : "결과 보기"}
              </button>
            </div>
          )
        )}
      </div>

      {/* FOOTER */}
      <footer className="py-3 px-6 bg-[#F8F9FA]/50 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-[#8B4513]/40 uppercase tracking-[0.15em]">
        <span>Correct: {correctCount} / {writingResults.length}</span>
        <span>Writing Assessment Training</span>
        <span>Word {currentIndex + 1} / {words.length}</span>
      </footer>
    </div>
  );
}
