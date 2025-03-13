import React, { useRef, useEffect } from "react";

interface VoiceWaveformProps {
  isRecording: boolean;
  audioData?: Float32Array;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isRecording,
  audioData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置画布大小
    if (canvas.width !== canvas.offsetWidth) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    // 清空画布
    ctx.fillStyle = "rgb(248, 249, 250)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isRecording || !audioData) {
      // 未录音时绘制一条水平线
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    // 绘制声纹
    const centerY = canvas.height / 2;
    const scale = 100; // 增加波形振幅

    // 绘制中心线
    ctx.beginPath();
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // 绘制波形
    const sliceWidth = canvas.width / audioData.length;

    // 绘制上半部分波形
    ctx.beginPath();
    ctx.strokeStyle = "#1a73e8";
    ctx.lineWidth = 2;
    ctx.moveTo(0, centerY);

    for (let i = 0; i < audioData.length; i++) {
      const amplitude = audioData[i] * scale;
      const y = centerY + amplitude;
      const x = i * sliceWidth;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 绘制下半部分波形（镜像）
    ctx.beginPath();
    ctx.strokeStyle = "#1a73e8";
    ctx.lineWidth = 2;
    ctx.moveTo(0, centerY);

    for (let i = 0; i < audioData.length; i++) {
      const amplitude = audioData[i] * scale;
      const y = centerY - amplitude;
      const x = i * sliceWidth;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 继续动画
    animationRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioData]);

  return (
    <div className={`voice-waveform ${isRecording ? "recording" : ""}`}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default VoiceWaveform;
