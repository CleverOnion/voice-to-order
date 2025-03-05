import { useState } from "react";
import "./App.css";
import OrderForm from "./components/OrderForm";
import RecognitionResult from "./components/RecognitionResult";
import VoiceButton from "./components/VoiceButton";
import SpeechRecognitionService from "./services/speechRecognition";
import { aliyunConfig } from "./config/aliyun";

interface OrderData {
  customerInfo: {
    name: string;
  } | null;
  productInfo: {
    name: string;
    quantity: number;
  } | null;
  driverInfo: {
    name: string;
  } | null;
}

const initialOrderData: OrderData = {
  customerInfo: null,
  productInfo: null,
  driverInfo: null,
};

// API 地址
const API_BASE_URL = "http://localhost:8080/api/recognition";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionText, setRecognitionText] = useState("");
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
  const [speechService] = useState(
    () => new SpeechRecognitionService(aliyunConfig)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [accumulatedText, setAccumulatedText] = useState("");

  const processRecognitionText = async (text: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Accept: "application/json",
        },
        body: text,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newOrderInfo = await response.json();
      console.log("解析后的订单信息:", newOrderInfo);

      // 合并新旧数据，保留已有的非空字段
      setOrderData((prevOrderData) => ({
        customerInfo: newOrderInfo.customerInfo?.name
          ? newOrderInfo.customerInfo
          : prevOrderData.customerInfo,
        productInfo: newOrderInfo.productInfo?.name
          ? newOrderInfo.productInfo
          : prevOrderData.productInfo,
        driverInfo: newOrderInfo.driverInfo?.name
          ? newOrderInfo.driverInfo
          : prevOrderData.driverInfo,
      }));
    } catch (error) {
      console.error("处理识别文本失败:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceButtonClick = async () => {
    try {
      if (!isRecording) {
        await speechService.startRecording((text) => {
          console.log("语音识别文本:", text);
          setRecognitionText(text);
          setAccumulatedText(text);
        });
      } else {
        speechService.stopRecording();
        if (accumulatedText) {
          await processRecognitionText(accumulatedText);
          setRecognitionText("");
          setAccumulatedText("");
          speechService.reset();
        }
      }
      setIsRecording(!isRecording);
    } catch (error) {
      console.error("语音识别出错:", error);
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    // TODO: 实现提交订单逻辑
    console.log("提交订单:", orderData);
  };

  const handleReset = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setOrderData(initialOrderData);
      setRecognitionText("");
      setAccumulatedText("");
      speechService.reset(); // 重置语音服务的状态
    } catch (error) {
      console.error("重置状态失败:", error);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>语音订单系统</h1>
        <div className="connection-status">
          <span className={isProcessing ? "status-processing" : "status-ready"}>
            {isProcessing ? "处理中" : "就绪"}
          </span>
        </div>
      </header>

      <main className="app-main">
        <OrderForm data={orderData} />
        <RecognitionResult text={recognitionText} isProcessing={isRecording} />
      </main>

      <div className="control-area">
        <div className="voice-control-container">
          <VoiceButton
            isRecording={isRecording}
            onClick={handleVoiceButtonClick}
            disabled={isProcessing}
          />
        </div>

        <div className="action-buttons">
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={isRecording || isProcessing}
          >
            重置
          </button>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={
              isRecording ||
              isProcessing ||
              !orderData.customerInfo?.name ||
              !orderData.productInfo?.name ||
              !orderData.driverInfo?.name
            }
          >
            提交订单
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">正在处理语音识别结果...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
