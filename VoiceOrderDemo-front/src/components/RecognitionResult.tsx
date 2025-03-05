import React from "react";
import "./RecognitionResult.css";

interface RecognitionResultProps {
  text: string;
  isProcessing: boolean;
}

const RecognitionResult: React.FC<RecognitionResultProps> = ({
  text,
  isProcessing,
}) => {
  return (
    <div className={`recognition-result ${isProcessing ? "processing" : ""}`}>
      <div className="result-header">
        <h3>识别结果</h3>
        {isProcessing && <div className="processing-indicator">处理中...</div>}
      </div>
      <div className="result-content">{text || "等待语音输入..."}</div>
    </div>
  );
};

export default RecognitionResult;
