interface SpeechRecognitionConfig {
  token: string;
  appKey: string;
}

interface MessageHeader {
  message_id: string;
  task_id: string;
  namespace: string;
  name: string;
  appkey?: string;
  status?: number;
  status_text?: string;
}

interface MessagePayload {
  result?: string;
  index?: number;
  time?: number;
  format?: string;
  sample_rate?: number;
  enable_intermediate_result?: boolean;
  enable_punctuation_prediction?: boolean;
  enable_inverse_text_normalization?: boolean;
  max_sentence_silence?: number;
  session_id?: string;
  begin_time?: number;
  confidence?: number;
}

interface WebSocketMessage {
  header: MessageHeader;
  payload?: MessagePayload;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

class SpeechRecognitionService {
  private config: SpeechRecognitionConfig;
  private ws: WebSocket | null = null;
  private onResultCallback: ((text: string) => void) | null = null;
  private isRecording: boolean = false;
  private currentTaskId: string = "";
  private audioContext: AudioContext | null = null;
  private cleanup: () => void = () => {};
  private currentSentence: string = ""; // 当前句子的临时结果
  private accumulatedText: string = ""; // 已确认的句子累积
  private currentSentenceIndex: number = 0; // 当前句子的索引
  private audioStream: MediaStream | null = null;

  constructor(config: SpeechRecognitionConfig) {
    this.config = config;
    // 在构造函数中初始化 AudioContext
    this.initAudioContext();
    // 预先检查音频设备
    this.checkAudioDevice();
  }

  private async checkAudioDevice(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("浏览器不支持音频录制");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioDevice = devices.some(
        (device) => device.kind === "audioinput"
      );
      if (!hasAudioDevice) {
        throw new Error("未检测到音频输入设备");
      }

      return true;
    } catch (err) {
      const error = err as Error;
      console.error("音频设备检查失败:", error);
      throw new Error(`音频设备检查失败: ${error.message}`);
    }
  }

  private async initAudioContext(): Promise<void> {
    try {
      if (!this.audioContext) {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      }

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (err) {
      const error = err as Error;
      console.error("初始化音频上下文失败:", error);
      throw new Error(`初始化音频上下文失败: ${error.message}`);
    }
  }

  private initWebSocket() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // 如果WebSocket连接已经存在且开启，直接返回
    }

    const url = `wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1?token=${this.config.token}`;
    this.ws = new WebSocket(url);
    this.currentTaskId = this.generateTaskId();

    this.ws.onopen = () => {
      console.log("语音识别WebSocket连接已建立");
      if (this.ws) {
        const startParams: WebSocketMessage = {
          header: {
            message_id: this.generateMessageId(),
            task_id: this.currentTaskId,
            namespace: "SpeechTranscriber",
            name: "StartTranscription",
            appkey: this.config.appKey,
          },
          payload: {
            format: "PCM",
            sample_rate: 16000,
            enable_intermediate_result: true,
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true,
            max_sentence_silence: 500,
          },
        };
        this.ws.send(JSON.stringify(startParams));
      }
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error("语音识别WebSocket错误:", error);
    };

    this.ws.onclose = () => {
      console.log("语音识别WebSocket连接已关闭");
      this.isRecording = false;
    };
  }

  private handleMessage(message: WebSocketMessage) {
    const { header, payload } = message;

    if (!header || !header.name) return;

    switch (header.name) {
      case "TranscriptionStarted":
        console.log("语音识别已开始，可以发送音频数据");
        break;

      case "SentenceBegin":
        if (payload?.index) {
          this.currentSentenceIndex = payload.index;
          console.log(`开始识别第 ${this.currentSentenceIndex} 句话`);
        }
        break;

      case "TranscriptionResultChanged":
        if (payload?.result && payload?.index === this.currentSentenceIndex) {
          // 更新当前句子的临时结果
          this.currentSentence = payload.result;
          // 发送完整的文本（已确认的句子 + 当前正在识别的句子）
          if (this.onResultCallback) {
            const fullText = this.accumulatedText
              ? `${this.accumulatedText}。${this.currentSentence}`
              : this.currentSentence;
            this.onResultCallback(fullText);
          }
        }
        break;

      case "SentenceEnd":
        if (payload?.result && payload?.index === this.currentSentenceIndex) {
          // 当前句子结束，添加到累积文本
          const finalSentence = payload.result;
          this.accumulatedText = this.accumulatedText
            ? `${this.accumulatedText}。${finalSentence}`
            : finalSentence;
          this.currentSentence = ""; // 清空当前句子
          // 发送完整的累积文本
          if (this.onResultCallback) {
            this.onResultCallback(this.accumulatedText);
          }
          console.log(
            `第 ${this.currentSentenceIndex} 句话识别完成:`,
            finalSentence
          );
        }
        break;

      case "TranscriptionCompleted":
        console.log("语音识别已完成");
        // 如果还有未确认的当前句子，添加到累积文本
        if (this.currentSentence) {
          this.accumulatedText = this.accumulatedText
            ? `${this.accumulatedText}。${this.currentSentence}`
            : this.currentSentence;
          if (this.onResultCallback) {
            this.onResultCallback(this.accumulatedText);
          }
        }
        this.stopRecording();
        break;

      case "TaskFailed":
        console.error("语音识别失败:", message);
        this.stopRecording();
        break;
    }
  }

  private generateMessageId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  private generateTaskId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }

  public async startRecording(onResult: (text: string) => void) {
    if (this.isRecording) return;

    try {
      this.onResultCallback = onResult;

      // 如果已经有音频流，先关闭它
      if (this.audioStream) {
        this.audioStream.getTracks().forEach((track) => track.stop());
      }

      // 初始化WebSocket连接
      this.initWebSocket();

      // 获取音频流
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      // 确保AudioContext已初始化
      await this.initAudioContext();

      if (!this.audioContext) {
        throw new Error("AudioContext未初始化");
      }

      const sourceNode = this.audioContext.createMediaStreamSource(
        this.audioStream
      );
      const scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      sourceNode.connect(scriptNode);
      scriptNode.connect(this.audioContext.destination);

      this.isRecording = true;
      this.currentSentence = "";
      this.currentSentenceIndex = 0;

      scriptNode.onaudioprocess = (audioProcessingEvent) => {
        if (this.ws?.readyState === WebSocket.OPEN && this.isRecording) {
          const inputBuffer = audioProcessingEvent.inputBuffer;
          const pcmData = this.convertToInt16PCM(inputBuffer);
          this.ws.send(pcmData);
        }
      };

      this.cleanup = () => {
        if (this.isRecording) {
          sourceNode.disconnect();
          scriptNode.disconnect();
          if (this.audioStream) {
            this.audioStream.getTracks().forEach((track) => track.stop());
          }
        }

        if (this.ws) {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
          }
          this.ws = null;
        }

        this.onResultCallback = null;
        this.isRecording = false;
      };
    } catch (err) {
      const error = err as Error;
      this.isRecording = false;
      this.cleanup();
      throw new Error(`开始录音失败: ${error.message}`);
    }
  }

  private convertToInt16PCM(audioBuffer: AudioBuffer): ArrayBuffer {
    const channelData = audioBuffer.getChannelData(0);
    const int16Data = new Int16Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return int16Data.buffer;
  }

  public stopRecording() {
    if (!this.isRecording) return;

    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const stopParams: WebSocketMessage = {
          header: {
            message_id: this.generateMessageId(),
            task_id: this.currentTaskId,
            namespace: "SpeechTranscriber",
            name: "StopTranscription",
            appkey: this.config.appKey,
          },
        };
        this.ws.send(JSON.stringify(stopParams));
      }
    } catch (error) {
      console.error("停止录音失败:", error);
    } finally {
      this.cleanup();
    }
  }

  public reset() {
    this.accumulatedText = "";
    this.currentSentence = "";
  }
}

export default SpeechRecognitionService;
