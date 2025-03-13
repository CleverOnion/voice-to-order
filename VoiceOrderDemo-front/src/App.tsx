import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import JargonPage from "./pages/Jargon/JargonPage";
import ProductPage from "./pages/Product/ProductPage";
import CustomerPage from "./pages/Customer/CustomerPage";
import DriverPage from "./pages/Driver/DriverPage";
import "./App.css";
import OrderForm from "./components/OrderForm";
import RecognitionResult from "./components/RecognitionResult";
import VoiceButton from "./components/VoiceButton";
import VoiceWaveform from "./components/VoiceWaveform";
import SpeechRecognitionService from "./services/speechRecognition";
import { aliyunConfig } from "./config/aliyun";
import { RECOGNITION_API } from "./config/api";

interface OrderData {
  customerInfo: {
    id: number;
    name: string;
    phone: string;
    exists?: boolean;
  } | null;
  productInfo: {
    name: string;
    quantity?: number;
  } | null;
  driverInfo: {
    id: number;
    name: string;
    phone: string;
    licensePlate: string;
    exists?: boolean;
  } | null;
}

const initialOrderData: OrderData = {
  customerInfo: null,
  productInfo: null,
  driverInfo: null,
};

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionText, setRecognitionText] = useState("");
  const [orderData, setOrderData] = useState<OrderData>(initialOrderData);
  const [speechService] = useState(
    () => new SpeechRecognitionService(aliyunConfig)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [accumulatedText, setAccumulatedText] = useState("");
  const [audioData, setAudioData] = useState<Float32Array>();

  const processRecognitionText = async (text: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(RECOGNITION_API.PROCESS, {
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

      setOrderData((prevOrderData) => ({
        customerInfo: newOrderInfo.customerInfo?.name
          ? {
              ...newOrderInfo.customerInfo,
              exists: newOrderInfo.customerInfo.exists ?? true,
            }
          : prevOrderData.customerInfo,
        productInfo: newOrderInfo.productInfo?.name
          ? newOrderInfo.productInfo
          : prevOrderData.productInfo,
        driverInfo: newOrderInfo.driverInfo?.name
          ? {
              ...newOrderInfo.driverInfo,
              exists: newOrderInfo.driverInfo.exists ?? true,
            }
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
        setIsPreparingRecording(true);
        await speechService.startRecording(
          (text) => {
            console.log("语音识别文本:", text);
            setRecognitionText(text);
            setAccumulatedText(text);
          },
          (data) => {
            setAudioData(data);
          }
        );
        setIsPreparingRecording(false);
      } else {
        speechService.stopRecording();
        if (accumulatedText) {
          await processRecognitionText(accumulatedText);
          setRecognitionText("");
          setAccumulatedText("");
          setAudioData(undefined);
          speechService.reset();
        }
      }
      setIsRecording(!isRecording);
    } catch (error) {
      console.error("语音识别出错:", error);
      setIsPreparingRecording(false);
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    // TODO: 实现提交订单逻辑
    console.log("提交订单:", orderData);
  };

  const handleReset = async () => {
    try {
      const response = await fetch(RECOGNITION_API.RESET, {
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
      setAudioData(undefined);
      speechService.reset();
    } catch (error) {
      console.error("重置状态失败:", error);
    }
  };

  const handleOrderDataChange = (newData: OrderData) => {
    setOrderData(newData);
  };

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/jargons" element={<JargonPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/customers" element={<CustomerPage />} />
          <Route path="/drivers" element={<DriverPage />} />
          <Route
            path="/"
            element={
              <div className="app-container">
                <header className="app-header">
                  <h1>语音订单系统</h1>
                  <div className="connection-status">
                    <span
                      className={
                        isProcessing || isPreparingRecording
                          ? "status-processing"
                          : "status-ready"
                      }
                    >
                      {isProcessing
                        ? "处理中"
                        : isPreparingRecording
                        ? "准备录音中"
                        : "就绪"}
                    </span>
                  </div>
                </header>

                <main className="app-main">
                  <OrderForm
                    data={orderData}
                    onDataChange={handleOrderDataChange}
                    disabled={isRecording || isProcessing}
                  />
                  <div className="input-section">
                    <div className="voice-input">
                      <VoiceWaveform
                        isRecording={isRecording}
                        audioData={audioData}
                      />
                      <RecognitionResult
                        text={recognitionText}
                        isProcessing={isRecording}
                      />
                    </div>
                  </div>
                </main>

                <div className="control-area">
                  <div className="voice-control-container">
                    <VoiceButton
                      isRecording={isRecording}
                      onClick={handleVoiceButtonClick}
                      disabled={isProcessing || isPreparingRecording}
                    />
                  </div>

                  <div className="action-buttons">
                    <button
                      className="reset-button"
                      onClick={handleReset}
                      disabled={
                        isRecording || isProcessing || isPreparingRecording
                      }
                    >
                      重置
                    </button>
                    <button
                      className="submit-button"
                      onClick={handleSubmit}
                      disabled={
                        isRecording ||
                        isProcessing ||
                        isPreparingRecording ||
                        !orderData.customerInfo?.name ||
                        orderData.customerInfo?.exists === false ||
                        !orderData.productInfo?.name ||
                        !orderData.productInfo?.quantity ||
                        !orderData.driverInfo?.name ||
                        orderData.driverInfo?.exists === false
                      }
                    >
                      提交订单
                    </button>
                  </div>
                </div>

                {(isProcessing || isPreparingRecording) && (
                  <div className="loading-overlay">
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <div className="loading-text">
                        {isProcessing
                          ? "正在处理语音识别结果..."
                          : "正在准备录音..."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
