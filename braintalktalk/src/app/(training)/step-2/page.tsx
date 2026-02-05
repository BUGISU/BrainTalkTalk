"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MainLayoutShell from "@/components/layout/MainLayoutShell";
import {
  SPEECH_REPETITION_PROTOCOLS,
  PlaceType,
} from "@/constants/trainingData";

export default function Step2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeParam = (searchParams.get("place") as PlaceType) || "home";

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const trainingData = useMemo(
    () =>
      SPEECH_REPETITION_PROTOCOLS[placeParam] ||
      SPEECH_REPETITION_PROTOCOLS.home,
    [placeParam],
  );
  const currentItem = trainingData[currentIndex];

  // 폰트 사이즈 계산 로직: 글자 수가 많아질수록 작게 (최소 2rem ~ 최대 5rem)
  const getFontSize = (text: string) => {
    const length = text.length;
    if (length <= 5) return "text-7xl lg:text-8xl";
    if (length <= 10) return "text-5xl lg:text-7xl";
    if (length <= 15) return "text-4xl lg:text-5xl";
    return "text-3xl lg:text-4xl"; // 아주 긴 문장
  };

  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Media fail:", err);
    }
  }, []);

  const startRecording = async () => {
    if (!streamRef.current) await initMedia();
    if (!streamRef.current) return;
    try {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      setIsRecording(true);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        setAudioLevel(dataArray.reduce((a, b) => a + b) / dataArray.length);
        animationRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error("Recording fail:", err);
    }
  };

  const stopAndNext = useCallback(() => {
    setIsRecording(false);
    setAudioLevel(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (currentIndex < trainingData.length - 1)
      setCurrentIndex((prev) => prev + 1);
    else router.push(`/step-3?place=${placeParam}`);
  }, [currentIndex, trainingData.length, router, placeParam]);

  useEffect(() => {
    setIsMounted(true);
    initMedia();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [initMedia]);

  if (!isMounted || !currentItem) return null;

  return (
    <MainLayoutShell
      monitoring={null}
      dashboard={null}
      content={
        <div className="flex flex-col lg:flex-row h-full w-full gap-6 lg:gap-10 p-4 lg:p-8 bg-white">
          {/* [좌측 패널] 고정 */}
          <div className="w-full lg:w-[280px] flex lg:flex-col gap-4 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-8">
            <div className="w-1/3 lg:w-full bg-black rounded-[30px] overflow-hidden aspect-video shadow-md border-2 border-white">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
            <div className="flex-1 lg:w-full bg-[#F8F9FA] rounded-[25px] p-5 space-y-4">
              <MetricRow label="대칭지수" value={92} color="bg-emerald-500" />
              <MetricRow
                label="음성 레벨"
                value={audioLevel}
                color="bg-blue-500"
              />
            </div>
          </div>

          {/* [메인 영역] */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex justify-end mb-4">
              <div className="bg-[#F8F9FA] px-5 py-1.5 rounded-xl font-black text-amber-500 border border-amber-50">
                {currentIndex + 1} / {trainingData.length}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-gray-300 font-bold text-lg mb-8">
                문장을 듣고 똑같이 말씀해 보세요
              </p>

              {/* 텍스트 박스 높이 고정 (h-48 ~ h-64) 및 내부 폰트 유동 조절 */}
              <div className="w-full max-w-[900px] h-[200px] lg:h-[320px] bg-[#8B4513] px-8 py-4 rounded-[50px] lg:rounded-[60px] shadow-xl border-b-[10px] lg:border-b-[14px] border-black/20 flex items-center justify-center">
                <h1
                  className={`text-white font-black text-center break-keep leading-tight transition-all duration-300 ${getFontSize(currentItem.text)}`}
                >
                  {currentItem.text}
                </h1>
              </div>

              <div className="mt-12 flex flex-col items-center gap-4">
                <button
                  onClick={isRecording ? stopAndNext : startRecording}
                  className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full shadow-xl transition-all flex items-center justify-center text-4xl lg:text-5xl ${
                    isRecording
                      ? "bg-red-500 animate-pulse"
                      : "bg-amber-500 hover:scale-105"
                  }`}
                >
                  {isRecording ? "⏹️" : "▶️"}
                </button>
                <p
                  className={`font-black uppercase tracking-widest text-[10px] lg:text-xs ${isRecording ? "text-red-500" : "text-gray-200"}`}
                >
                  {isRecording ? "분석 중 - 완료 시 클릭" : "START TRAINING"}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase">
        <span>{label}</span>
        <span>{value.toFixed(0)}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
