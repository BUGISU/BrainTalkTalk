// src/app/(training)/step-3/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { calculateLipMetrics, LipMetrics } from "@/utils/faceAnalysis";
import { VISUAL_MATCHING_PROTOCOLS, PlaceType } from "@/constants/trainingData";

// ============================================
// 1. 인터페이스 정의
// ============================================
interface MatchingOption {
  id: string;
  img: string;
  label: string;
  emoji?: string;
}

interface MatchingQuestion {
  id: number;
  targetWord: string;
  options: MatchingOption[];
  answerId: string;
}

interface SessionMetrics {
  faceFrames: Array<{ timestamp: number; metrics: LipMetrics }>;
  voiceSamples: Array<{ timestamp: number; amplitude: number }>;
  responses: Array<{
    questionId: number;
    selectedId: string;
    isCorrect: boolean;
    responseTime: number;
  }>;
}

// ============================================
// 2. 메인 컴포넌트
// ============================================
export default function Step3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const place = (searchParams.get("place") as PlaceType) || "home";
  const step1Score = searchParams.get("step1") || "0";

  // 훈련 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );

  // 분석 상태
  const [faceMetrics, setFaceMetrics] = useState<LipMetrics>({
    symmetryScore: 100,
    openingRatio: 0,
    isStretched: false,
    deviation: 0,
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isFaceReady, setIsFaceReady] = useState(false);

  // 세션 데이터 수집
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    faceFrames: [],
    voiceSamples: [],
    responses: [],
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioAnimationRef = useRef<number | null>(null);

  // 훈련 데이터
  const trainingData: MatchingQuestion[] = useMemo(() => {
    return VISUAL_MATCHING_PROTOCOLS[place] || VISUAL_MATCHING_PROTOCOLS.home;
  }, [place]);

  const currentItem = trainingData[currentIndex];

  // ============================================
  // 3. 카메라 & 안면 추적 초기화
  // ============================================
  useEffect(() => {
    setIsMounted(true);
    let isCancelled = false;

    async function initFaceTracking() {
      try {
        // MediaPipe 초기화
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        });

        if (isCancelled) return;
        landmarkerRef.current = landmarker;

        // 카메라 스트림 획득
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { aspectRatio: 1.333, width: 320, height: 240 },
          audio: true, // 오디오도 함께 획득
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsFaceReady(true);
            animationRef.current = requestAnimationFrame(predictFace);
          };
        }

        // 오디오 분석 초기화
        initAudioAnalysis(stream);
      } catch (err) {
        console.error("초기화 실패:", err);
      }
    }

    initFaceTracking();

    return () => {
      isCancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioAnimationRef.current)
        cancelAnimationFrame(audioAnimationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ============================================
  // 4. 안면 추적 루프
  // ============================================
  const predictFace = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (landmarker && video && video.readyState >= 2) {
      const results = landmarker.detectForVideo(video, performance.now());

      if (results.faceLandmarks?.[0]) {
        const metrics = calculateLipMetrics(results.faceLandmarks[0]);
        setFaceMetrics(metrics);

        // 세션 데이터에 프레임 추가
        setSessionMetrics((prev) => ({
          ...prev,
          faceFrames: [...prev.faceFrames, { timestamp: Date.now(), metrics }],
        }));
      }
    }

    animationRef.current = requestAnimationFrame(predictFace);
  }, []);

  // ============================================
  // 5. 오디오 분석 초기화
  // ============================================
  const initAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setIsRecording(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average);

        // 세션 데이터에 음성 샘플 추가 (10프레임마다)
        if (Math.random() < 0.1) {
          setSessionMetrics((prev) => ({
            ...prev,
            voiceSamples: [
              ...prev.voiceSamples,
              { timestamp: Date.now(), amplitude: average },
            ],
          }));
        }

        audioAnimationRef.current = requestAnimationFrame(updateAudio);
      };
      updateAudio();
    } catch (err) {
      console.error("오디오 분석 실패:", err);
    }
  };

  // ============================================
  // 6. 답변 처리
  // ============================================
  const handleOptionClick = useCallback(
    (id: string) => {
      if (selectedId || !currentItem) return;

      const responseTime = Date.now() - questionStartTime;
      const isCorrect = id === currentItem.answerId;

      setSelectedId(id);
      setShowResult(isCorrect);

      // 응답 기록
      setSessionMetrics((prev) => ({
        ...prev,
        responses: [
          ...prev.responses,
          {
            questionId: currentItem.id,
            selectedId: id,
            isCorrect,
            responseTime,
          },
        ],
      }));

      // 1.5초 후 다음 문제로
      setTimeout(() => {
        if (currentIndex < trainingData.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedId(null);
          setShowResult(null);
          setQuestionStartTime(Date.now());
        } else {
          // 훈련 완료 - 결과 페이지로 이동
          finishTraining();
        }
      }, 1500);
    },
    [
      selectedId,
      currentItem,
      currentIndex,
      trainingData.length,
      questionStartTime,
    ],
  );

  // ============================================
  // 7. 훈련 완료 처리
  // ============================================
  const finishTraining = () => {
    // 세션 데이터를 localStorage에 저장
    const sessionData = {
      sessionId: `session_${Date.now()}`,
      place,
      step1Score: parseInt(step1Score),
      step3Score: sessionMetrics.responses.filter((r) => r.isCorrect).length,
      metrics: sessionMetrics,
      completedAt: Date.now(),
    };

    localStorage.setItem("btt.lastSession", JSON.stringify(sessionData));

    // 결과 페이지로 이동
    router.push(
      `/result?place=${place}&step1=${step1Score}&step3=${sessionData.step3Score}`,
    );
  };

  // ============================================
  // 8. 렌더링
  // ============================================
  if (!isMounted || !currentItem) return null;

  const correctCount = sessionMetrics.responses.filter(
    (r) => r.isCorrect,
  ).length;

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden text-black font-sans">
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
        <div className="text-left">
          <span className="text-[#DAA520] font-black text-[10px] tracking-widest uppercase block mb-0.5">
            Step 03 • {place.toUpperCase()}
          </span>
          <h2 className="text-xl font-black text-[#8B4513] tracking-tighter">
            단어-그림 매칭
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* 안면 상태 인디케이터 */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isFaceReady
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {isFaceReady ? "📷 추적중" : "⏳ 로딩"}
          </div>
          <div className="bg-[#F8F9FA] px-4 py-1.5 rounded-2xl font-black text-lg text-[#DAA520]">
            {currentIndex + 1} / {trainingData.length}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 좌측: 카메라 + 분석 */}
        <div className="w-64 flex flex-col gap-3">
          {/* 카메라 프리뷰 */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            {/* 안면 가이드 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-20 border-2 border-dashed border-green-400/50 rounded-full" />
            </div>
            {!isFaceReady && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-sm font-bold animate-pulse">
                  카메라 로딩 중...
                </span>
              </div>
            )}
          </div>

          {/* 실시간 분석 지표 */}
          <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              실시간 분석
            </h4>
            <div className="space-y-1.5">
              <MetricBar
                label="대칭지수"
                value={faceMetrics.symmetryScore}
                max={100}
                unit="%"
                color="emerald"
              />
              <MetricBar
                label="개구도"
                value={faceMetrics.openingRatio}
                max={50}
                unit=""
                color="amber"
              />
              <MetricBar
                label="음성 레벨"
                value={audioLevel}
                max={100}
                unit="dB"
                color="blue"
              />
            </div>
          </div>

          {/* 점수 현황 */}
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-amber-600 font-bold">현재 점수</p>
            <p className="text-2xl font-black text-amber-700">
              {correctCount} / {currentIndex}
            </p>
          </div>
        </div>

        {/* 우측: 훈련 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* 제시어 */}
          <div className="text-center space-y-3">
            <p className="text-gray-400 font-bold text-sm uppercase tracking-wide">
              아래 단어에 맞는 그림을 선택하세요
            </p>
            <div className="bg-[#8B4513] px-12 py-6 rounded-[30px] shadow-xl">
              <h1 className="text-5xl font-black text-white tracking-widest">
                {currentItem.targetWord}
              </h1>
            </div>
          </div>

          {/* 3x2 그림 그리드 */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
            {currentItem.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={selectedId !== null}
                className={`
                  relative aspect-square rounded-[30px] flex flex-col items-center justify-center
                  transition-all duration-300 border-4 shadow-lg
                  ${
                    selectedId === option.id
                      ? showResult
                        ? "bg-green-50 border-green-500 scale-105"
                        : "bg-red-50 border-red-500 scale-95"
                      : selectedId !== null
                        ? "opacity-50"
                        : "bg-[#F8F9FA] border-white hover:border-[#DAA520]/30 hover:bg-white active:scale-95"
                  }
                `}
              >
                {/* 이미지 또는 이모지 */}
                <span className="text-6xl mb-2">{option.emoji || "📷"}</span>
                <span className="text-sm font-bold text-gray-600">
                  {option.label}
                </span>

                {/* 정답/오답 오버레이 */}
                {selectedId === option.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-[30px] backdrop-blur-[2px]">
                    <span className="text-7xl animate-bounce">
                      {showResult ? "⭕" : "❌"}
                    </span>
                  </div>
                )}

                {/* 정답 표시 (오답 선택 시) */}
                {selectedId !== null &&
                  !showResult &&
                  option.id === currentItem.answerId && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-3 px-6 bg-[#F8F9FA]/50 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-[#8B4513]/40 uppercase tracking-[0.15em]">
        <span>
          SI: {faceMetrics.symmetryScore}% | Voice: {audioLevel.toFixed(1)} dB
        </span>
        <span>Visual-Verbal Association Training</span>
        <span>
          Frames: {sessionMetrics.faceFrames.length} | Samples:{" "}
          {sessionMetrics.voiceSamples.length}
        </span>
      </footer>
    </div>
  );
}

// ============================================
// 9. 서브 컴포넌트: MetricBar
// ============================================
function MetricBar({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: "emerald" | "amber" | "blue";
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-gray-500 w-14">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-150`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-gray-600 w-12 text-right">
        {value.toFixed(1)}
        {unit}
      </span>
    </div>
  );
}
