"use client";

import React, { useState, useRef, useMemo } from "react"; // 🔹 useMemo 추가
import { useRouter } from "next/navigation";
import FaceTracker from "@/components/diagnosis/FaceTracker";
import { MetricEngine } from "@/lib/training/MetricEngine";
import {
  SPEECH_REPETITION_PROTOCOLS,
  PlaceType,
} from "@/constants/trainingData";

export default function Step2Page() {
  const router = useRouter();
  const [currentPlace] = useState<PlaceType>("cafe");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [metrics, setMetrics] = useState({ symmetryScore: 0, openingRatio: 0 });
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [resultScore, setResultScore] = useState<number | null>(null);

  const audioEngineRef = useRef<MetricEngine | null>(null);

  // 🔹 랜덤 섞기
  const protocol = useMemo(() => {
    const questions = SPEECH_REPETITION_PROTOCOLS[currentPlace];

    // Fisher-Yates 셔플
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [currentPlace]);

  const currentItem = protocol[currentIndex];

  const handleToggleRecording = async () => {
    if (!isRecording) {
      setResultScore(null);
      try {
        if (!audioEngineRef.current)
          audioEngineRef.current = new MetricEngine();
        await audioEngineRef.current.startAudioAnalysis((level) =>
          setAudioLevel(level),
        );
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      audioEngineRef.current?.stop();
      setIsRecording(false);
      setResultScore(
        Math.min(
          100,
          Math.floor(
            metrics.symmetryScore * 0.8 + (metrics.openingRatio > 15 ? 20 : 10),
          ),
        ),
      );
      setTimeout(() => {
        if (currentIndex < protocol.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setResultScore(null);
        } else {
          router.push("/step-3");
        }
      }, 1200);
    }
  };

  return (
    <>
      <header className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
        <div className="text-left">
          <span className="text-[#DAA520] font-black text-[11px] tracking-[0.2em] uppercase">
            Step 02 • {currentPlace.toUpperCase()}
          </span>
          <h2 className="text-2xl font-black text-[#8B4513] tracking-tighter">
            문장 복창 훈련
          </h2>
        </div>
        <div className="bg-gray-50 px-5 py-2 rounded-full font-black text-sm text-gray-400">
          <span className="text-orange-500">{currentIndex + 1}</span> /{" "}
          {protocol.length}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[380px] border-r border-gray-50 bg-[#FCFCFC] p-8 shrink-0">
          <div className="space-y-4">
            <FaceTracker
              onMetricsUpdate={(m) =>
                setMetrics({
                  symmetryScore: m.symmetryScore,
                  openingRatio: m.openingRatio * 100,
                })
              }
            />
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
              <MetricBar
                label="안면 대칭"
                value={metrics.symmetryScore}
                unit="%"
                color="bg-emerald-500"
              />
              <MetricBar
                label="입 벌림"
                value={metrics.openingRatio}
                unit=""
                color="bg-amber-400"
              />
              <MetricBar
                label="음성 레벨"
                value={audioLevel}
                unit="dB"
                color="bg-blue-500"
              />
            </div>
            {resultScore !== null && (
              <div className="bg-orange-50 rounded-[32px] p-6 text-center border border-orange-100 animate-in fade-in zoom-in duration-300">
                <p className="text-4xl font-black text-orange-700">
                  {resultScore}%
                </p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center bg-white px-20">
          <div className="w-full max-w-3xl flex flex-col items-center gap-12">
            <p className="text-gray-400 font-bold text-sm uppercase tracking-[0.3em]">
              정확하게 따라 읽어보세요
            </p>

            <div className="bg-[#8B4513] w-full py-20 px-12 rounded-[70px] shadow-2xl text-center relative overflow-hidden min-h-[280px] flex items-center justify-center">
              <h1 className="text-5xl font-black text-white leading-tight break-keep z-10">
                {currentItem?.text}
              </h1>
              <div className="absolute top-[-20px] right-[-10px] text-white/5 text-[180px] font-black italic select-none">
                {currentIndex + 1}
              </div>
            </div>

            <div className="h-48 flex flex-col items-center justify-center gap-6">
              <button
                onClick={handleToggleRecording}
                className={`relative w-32 h-32 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
                  isRecording
                    ? "bg-red-500 ring-[12px] ring-red-50"
                    : "bg-orange-500 hover:scale-105"
                }`}
              >
                {isRecording ? (
                  <div className="w-10 h-10 bg-white rounded-md animate-pulse" />
                ) : (
                  <div className="w-0 h-0 border-t-[22px] border-t-transparent border-l-[36px] border-l-white border-b-[22px] border-b-transparent ml-3" />
                )}
              </button>
              <p
                className={`font-black text-xs tracking-widest uppercase transition-colors ${isRecording ? "text-red-500" : "text-gray-300"}`}
              >
                {isRecording ? "분석 중입니다..." : "버튼을 눌러 훈련 시작"}
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function MetricBar({ label, value, unit, color }: any) {
  return (
    <div className="space-y-1.5 font-black">
      <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-tighter">
        <span>{label}</span>
        <span>
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
