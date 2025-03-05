import { useState, useEffect, useCallback } from "react";
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

// WebSocket服务器地址
const WS_URL = "ws://localhost:8080/api/ws/recognition";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionText, setRecognitionText] = useState("");
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
  const [speechService] = useState(
    () => new SpeechRecognitionService(aliyunConfig)
  );
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket连接管理
  const connectWebSocket = useCallback(() => {
    console.log("正在连接WebSocket...");
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log("WebSocket连接已建立");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        console.log("收到WebSocket消息:", event.data);
        const orderInfo = JSON.parse(event.data);
        console.log("解析后的订单信息:", orderInfo);
        setOrderData(orderInfo);
      } catch (error) {
        console.error("解析订单信息失败:", error);
      }
    };

    socket.onclose = (event) => {
      console.log("WebSocket连接已关闭:", event.code, event.reason);
      setIsConnected(false);
      setWs(null);
      // 5秒后尝试重连
      setTimeout(connectWebSocket, 5000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket错误:", error);
      setIsConnected(false);
    };

    setWs(socket);
  }, []);

  // 组件挂载时建立WebSocket连接
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  const handleVoiceButtonClick = async () => {
    try {
      if (!isRecording) {
        if (!isConnected) {
          console.log("WebSocket未连接，尝试重新连接...");
          connectWebSocket();
          return;
        }
        await speechService.startRecording((text) => {
          console.log("语音识别文本:", text);
          setRecognitionText(text);
          // 发送识别文本到WebSocket服务器
          if (ws && ws.readyState === WebSocket.OPEN) {
            console.log("发送文本到WebSocket服务器:", text);
            ws.send(text);
          } else {
            console.error("WebSocket未连接，无法发送消息");
          }
        });
      } else {
        speechService.stopRecording();
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

  const handleReset = () => {
    setOrderData(initialOrderData);
    setRecognitionText("");
    // 通知后端重置状态
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("RESET_STATE");
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>语音订单系统</h1>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">已连接</span>
          ) : (
            <span className="status-disconnected">未连接</span>
          )}
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
            disabled={!isConnected}
          />
        </div>

        <div className="action-buttons">
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={isRecording || !isConnected}
          >
            重置
          </button>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={
              isRecording ||
              !isConnected ||
              !orderData.customerInfo?.name ||
              !orderData.productInfo?.name ||
              !orderData.driverInfo?.name
            }
          >
            提交订单
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
