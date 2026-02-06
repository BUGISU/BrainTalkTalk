"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // ✅ 녹음 관련 상태
  const [recordedAudios, setRecordedAudios] = useState<
    Array<{
      text: string;
      audioUrl: string;
    }>
  >([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [step1Items, setStep1Items] = useState<
    Array<{
      question: string;
      isCorrect: boolean;
    }>
  >([]);
  // 1. 점수 데이터 파싱
  const s = {
    1: Number(searchParams.get("step1") || 0),
    2: Number(searchParams.get("step2") || 0),
    3: Number(searchParams.get("step3") || 0),
    4: Number(searchParams.get("step4") || 0),
    5: Number(searchParams.get("step5") || 0),
    6: Number(searchParams.get("step6") || 0),
  };

  useEffect(() => {
    setIsMounted(true);

    // ✅ Step 2 녹음 파일 불러오기
    const savedAudios = localStorage.getItem("step2_recorded_audios");
    if (savedAudios) {
      try {
        setRecordedAudios(JSON.parse(savedAudios));
      } catch (e) {
        console.error("녹음 불러오기 실패", e);
      }
    }

    // ✅ K-WAB 세션 데이터 불러오기
    const sessionData = localStorage.getItem("kwab_training_session");
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        console.log("📊 전체 세션 데이터:", session);

        // ✅ Step 1 문항별 결과 불러오기
        if (session.step1?.items) {
          console.log("✅ Step 1 문항별 데이터:", session.step1.items);
          setStep1Items(session.step1.items);
        } else {
          console.warn("❌ Step 1 items가 없습니다");
        }
      } catch (e) {
        console.error("세션 불러오기 실패", e);
      }
    }
  }, []);

  // ✅ 녹음 재생/정지 함수
  const playAudio = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(recordedAudios[index].audioUrl);
    audioRef.current = audio;
    setPlayingIndex(index);

    audio.onended = () => {
      setPlayingIndex(null);
      audioRef.current = null;
    };

    audio.play();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIndex(null);
    }
  };

  // 2. 항목별 상세 문제 및 가중치 데이터
  const stepDetails = useMemo(
    () => [
      {
        id: 1,
        title: "청각 이해",
        score: s[1],
        max: 20,
        color: "#DAA520", // ✅ 골드
        desc: "예/아니오 및 명령어 이행 능력",
        questions: [
          {
            q: "명령 이행 (신체 부위 가리키기)",
            weight: 12,
            get: Math.min(s[1], 12),
            type: "중량",
            info: "복합 지시",
          },
          {
            q: "청각적 낱말 인지",
            weight: 8,
            get: s[1] > 12 ? s[1] - 12 : 0,
            type: "기초",
            info: "명사 선택",
          },
        ],
      },
      {
        id: 2,
        title: "따라말하기",
        score: s[2],
        max: 10,
        color: "#DAA520",
        desc: "단어 및 문장 복사 능력",
        questions: [
          {
            q: "음절 구조 복잡 문장",
            weight: 6,
            get: s[2] > 4 ? s[2] - 4 : 0,
            type: "조음",
            info: "다중 폐쇄음",
          },
          {
            q: "일상 단어 따라하기",
            weight: 4,
            get: Math.min(s[2], 4),
            type: "단순",
            info: "2음절 단어",
          },
        ],
      },
      {
        id: 3,
        title: "이름대기",
        score: s[3],
        max: 10,
        color: "#DAA520",
        desc: "사물 명칭 인출 및 유창성",
        questions: [
          {
            q: "사물 이름대기",
            weight: 5,
            get: Math.min(s[3], 5),
            type: "인출",
            info: "시각 자극",
          },
          {
            q: "문장 완성하기",
            weight: 5,
            get: s[3] > 5 ? s[3] - 5 : 0,
            type: "연상",
            info: "언어 맥락",
          },
        ],
      },
      {
        id: 4,
        title: "스스로 말하기",
        score: s[4],
        max: 100,
        color: "#DAA520",
        desc: "내용 전달력 및 발화 유창성",
        questions: [
          {
            q: "그림 묘사 및 유창성",
            weight: 100,
            get: s[4],
            type: "종합",
            info: "담화 분석",
          },
        ],
      },
      {
        id: 5,
        title: "읽기 능력",
        score: s[5],
        max: 100,
        color: "#8B4513", // ✅ 브라운 (서브)
        desc: "문자 해독 및 의미 파악",
        questions: [
          {
            q: "지문 낭독 및 이해",
            weight: 100,
            get: s[5],
            type: "독해",
            info: "복문 구조",
          },
        ],
      },
      {
        id: 6,
        title: "쓰기 능력",
        score: s[6],
        max: 8,
        color: "#8B4513",
        desc: "단어 받아쓰기 및 자형 구성",
        questions: [
          {
            q: "의료 단어 받아쓰기",
            weight: 8,
            get: s[6],
            type: "필기",
            info: "이미지-글자 연상",
          },
        ],
      },
    ],
    [s],
  );

  // 3. 방사형 그래프 좌표 계산
  const chartPoints = useMemo(() => {
    const values = [
      s[4],
      (s[1] / 20) * 100,
      (s[2] / 10) * 100,
      (s[3] / 10) * 100,
      s[5],
      (s[6] / 8) * 100,
    ];
    return values
      .map((val, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const r = (Math.min(val, 100) / 100) * 75;
        return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
      })
      .join(" ");
  }, [s]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-8 font-sans text-[#8B4513] print:bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 리포트 상단 영역 */}
        <header className="bg-white rounded-[30px] p-8 shadow-lg flex justify-between items-start border-b-4 border-[#DAA520]">
          <div>
            <h1 className="text-3xl font-black text-[#8B4513] tracking-tight">
              점수 요약표
            </h1>
            <p className="text-[#DAA520] font-bold text-sm mt-1 uppercase">
              Aphasia Assessment Report
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#DAA520]">
              AQ:{" "}
              {(
                ((s[4] / 100) * 20 +
                  (s[1] / 20) * 10 +
                  (s[2] / 10) * 10 +
                  (s[3] / 10) * 10) *
                2
              ).toFixed(1)}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
              Aphasia Quotient
            </p>
          </div>
        </header>

        {/* 01. 역량 프로파일 그래프 */}
        <section className="bg-white rounded-[30px] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xl font-black text-[#DAA520]">01</span>
            <h2 className="text-lg font-bold text-[#8B4513] tracking-tight">
              언어 역량 주요 요인 프로파일
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            {/* SVG 레이더 차트 */}
            <div className="relative w-56 h-56">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {[0.25, 0.5, 0.75, 1].map((step) => (
                  <polygon
                    key={step}
                    points={stepDetails
                      .map((_, i) => {
                        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                        return `${100 + 75 * step * Math.cos(angle)},${100 + 75 * step * Math.sin(angle)}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#FEF3C7"
                    strokeWidth="1"
                  />
                ))}
                {stepDetails.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  return (
                    <line
                      key={i}
                      x1="100"
                      y1="100"
                      x2={100 + 75 * Math.cos(angle)}
                      y2={100 + 75 * Math.sin(angle)}
                      stroke="#FEF3C7"
                      strokeWidth="1"
                    />
                  );
                })}
                <polygon
                  points={chartPoints}
                  fill="rgba(218, 165, 32, 0.1)"
                  stroke="#DAA520"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {chartPoints.split(" ").map((p, i) => {
                  const [x, y] = p.split(",");
                  return (
                    <circle key={i} cx={x} cy={y} r="3.5" fill="#DAA520" />
                  );
                })}
              </svg>
            </div>

            {/* 데이터 수치 정보 */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {stepDetails.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-col border-l-2 border-amber-100 pl-3"
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {step.title}
                  </span>
                  <span className="text-sm font-black text-[#8B4513]">
                    {Math.round((step.score / step.max) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 02. 항목별 상세 성취도 */}
        <section className="bg-white rounded-[30px] p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl font-black text-[#DAA520]">02</span>
            <h2 className="text-lg font-bold text-[#8B4513] tracking-tight">
              항목별 상세 성취도 분석
            </h2>
          </div>

          <div className="space-y-3">
            {stepDetails.map((step) => {
              const isOpen = expandedStep === step.id;
              return (
                <div
                  key={step.id}
                  className="border border-amber-100 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  {/* 아코디언 헤더 */}
                  <button
                    onClick={() => setExpandedStep(isOpen ? null : step.id)}
                    className={`w-full flex items-center justify-between p-5 transition-colors ${isOpen ? "bg-amber-50" : "hover:bg-amber-50/50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-1 h-6 rounded-full ${isOpen ? "bg-[#DAA520]" : "bg-amber-200"}`}
                      />
                      <div className="text-left">
                        <h3 className="text-sm font-black text-[#8B4513]">
                          {step.title}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-black text-[#DAA520]">
                          {step.score}
                        </span>
                        <span className="text-[10px] text-gray-300 ml-1">
                          / {step.max}
                        </span>
                      </div>
                      <span
                        className={`text-gray-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>
                  {/* 아코디언 상세 내용 */}
                  <div
                    className="transition-all duration-500 ease-in-out bg-white overflow-hidden"
                    style={{
                      maxHeight: isOpen ? "5000px" : "0px", // ✅ 충분히 큰 값
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="p-6 pt-0 space-y-4">
                      <div className="h-px bg-amber-50 w-full mb-4" />

                      {/* ✅ 총점 요약 */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-[#DAA520]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📊</span>
                            <div>
                              <p className="text-xs font-bold text-gray-500 mb-1">
                                총 획득 점수
                              </p>
                              <p className="text-lg font-black text-[#8B4513]">
                                {step.score}{" "}
                                <span className="text-sm text-gray-400">
                                  / {step.max} 점
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold">
                              달성률
                            </p>
                            <p className="text-2xl font-black text-[#DAA520]">
                              {Math.round((step.score / step.max) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ✅ 문항별 상세 점수
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 mb-3">
                          📝 문항별 세부 점수
                        </p>
                        {step.questions.map((q, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 items-center bg-amber-50 p-4 rounded-xl border border-amber-100"
                          >
                            <div className="col-span-7">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white text-gray-400 border border-amber-100 uppercase tracking-tighter">
                                  {q.type}
                                </span>
                                <span className="text-[10px] text-gray-300 font-bold italic">
                                  {q.info}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-gray-600 leading-snug">
                                {q.q}
                              </p>
                            </div>
                            <div className="col-span-2 text-center text-[10px] font-bold text-gray-300 uppercase">
                              배점 {q.weight}
                            </div>
                            <div className="col-span-3 text-right">
                              <span
                                className={`text-sm font-black ${q.get > 0 ? "text-[#8B4513]" : "text-gray-200"}`}
                              >
                                {q.get}{" "}
                                <span className="text-[9px] font-normal text-gray-400">
                                  점
                                </span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div> */}

                      {/* ✅ Step 1 문항별 정답 현황 */}
                      {step.id === 1 && step1Items.length > 0 && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                          <p className="text-xs font-bold text-blue-600 mb-3">
                            ✅ 문항별 정답 현황
                          </p>
                          <div className="space-y-2">
                            {step1Items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 bg-white p-3 rounded-lg"
                              >
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    item.isCorrect
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-200 text-gray-400"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <span
                                  className={`flex-1 text-xs font-bold ${item.isCorrect ? "text-blue-700" : "text-gray-400"}`}
                                >
                                  {item.question.length > 50
                                    ? item.question.substring(0, 50) + "..."
                                    : item.question}
                                </span>
                                <span className="text-xl">
                                  {item.isCorrect ? "⭕" : "❌"}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-blue-500 font-bold mt-3">
                            총 {step.max}문항 중 {step.score}문항 정답 (
                            {Math.round((step.score / step.max) * 100)}%)
                          </p>
                        </div>
                      )}

                      {/* ✅ Step 2, 3 간단한 그리드 표시 */}
                      {step.id >= 2 && step.id <= 3 && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                          <p className="text-xs font-bold text-blue-600 mb-2">
                            ✅ 실제 수행한 문항
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: step.max }).map((_, i) => (
                              <div
                                key={i}
                                className={`text-center py-2 rounded-lg text-xs font-bold ${
                                  i < step.score
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-300 border border-blue-100"
                                }`}
                              >
                                {i + 1}번
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-blue-500 font-bold mt-3">
                            총 {step.max}문항 중 {step.score}문항 정답 (
                            {Math.round((step.score / step.max) * 100)}%)
                          </p>
                        </div>
                      )}

                      {/* 하단 요약 문구 */}
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-[10px] text-[#8B4513] font-bold leading-relaxed">
                          ⚠️ K-WAB 기준을 적용하여 오답 시 0점 처리되며, 반응
                          시간 가중치가 반영되었습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ✅ 녹음 재생 섹션 */}
        {recordedAudios.length > 0 && (
          <section className="bg-white rounded-[30px] p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl font-black text-[#DAA520]">03</span>
              <h2 className="text-lg font-bold text-[#8B4513] tracking-tight">
                🎙️ 녹음 다시 듣기
              </h2>
            </div>
            <div className="space-y-2">
              {recordedAudios.map((audio, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100"
                >
                  <span className="w-8 h-8 bg-[#DAA520] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-bold text-[#8B4513] truncate">
                    {audio.text}
                  </span>
                  <button
                    onClick={() =>
                      playingIndex === idx ? stopAudio() : playAudio(idx)
                    }
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      playingIndex === idx
                        ? "bg-red-500 text-white"
                        : "bg-[#DAA520] text-white hover:bg-[#B8860B]"
                    }`}
                  >
                    {playingIndex === idx ? "⏹️ 정지" : "▶️ 재생"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 저장 및 제어 버튼 */}
        <div className="flex gap-4 pt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 py-5 bg-[#8B4513] text-white rounded-[30px] font-black text-sm shadow-xl hover:bg-[#6B3410] active:scale-95 transition-all"
          >
            리포트 PDF 저장
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-5 bg-white text-gray-400 rounded-[30px] font-black text-sm border-2 border-amber-100 hover:bg-amber-50 transition-all"
          >
            테스트 다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
