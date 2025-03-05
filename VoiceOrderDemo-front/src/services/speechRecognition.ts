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
  private accumulatedText: string = "";
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastSentText: string = "";

  constructor(config: SpeechRecognitionConfig) {
    this.config = config;
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      const error = err as Error;
      console.error("音频设备检查失败:", error);
      throw new Error(`音频设备检查失败: ${error.message}`);
    }
  }

  private async initAudioContext(): Promise<void> {
    try {
      if (this.audioContext) {
        await this.audioContext.close();
      }

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });

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
      case "TranscriptionResultChanged":
        if (payload?.result) {
          // 更新中间结果，但不立即发送
          if (this.onResultCallback) {
            this.onResultCallback(payload.result);
          }
        }
        break;
      case "SentenceEnd":
        if (payload?.result) {
          // 更新累积的文本
          this.accumulatedText = this.accumulatedText
            ? this.accumulatedText + " " + payload.result
            : payload.result;

          // 使用防抖发送完整的句子结果
          this.debounceSendText(this.accumulatedText);
        }
        break;
      case "TranscriptionCompleted":
        console.log("语音识别已完成");
        // 确保发送最后的文本
        if (
          this.accumulatedText &&
          this.accumulatedText !== this.lastSentText
        ) {
          this.sendTextImmediately(this.accumulatedText);
        }
        this.stopRecording();
        break;
      case "TaskFailed":
        console.error("语音识别失败:", message);
        this.stopRecording();
        break;
    }
  }

  private debounceSendText(text: string) {
    // 取消之前的定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 设置新的定时器，1秒后发送文本
    this.debounceTimer = setTimeout(() => {
      this.sendTextImmediately(text);
    }, 1000);
  }

  private sendTextImmediately(text: string) {
    if (text && text !== this.lastSentText && this.onResultCallback) {
      this.lastSentText = text;
      this.onResultCallback(text);
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
      await this.checkAudioDevice();
      await this.initAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      if (!this.audioContext) {
        throw new Error("AudioContext未初始化");
      }

      const sourceNode = this.audioContext.createMediaStreamSource(stream);
      const scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      sourceNode.connect(scriptNode);
      scriptNode.connect(this.audioContext.destination);

      this.onResultCallback = onResult;
      this.isRecording = true;
      this.accumulatedText = ""; // 重置累积的文本

      this.initWebSocket();

      scriptNode.onaudioprocess = (audioProcessingEvent) => {
        if (this.ws?.readyState === WebSocket.OPEN && this.isRecording) {
          const inputBuffer = audioProcessingEvent.inputBuffer;
          const pcmData = this.convertToInt16PCM(inputBuffer);

          // 发送音频数据
          this.ws.send(pcmData);
        }
      };

      this.cleanup = () => {
        if (this.isRecording) {
          sourceNode.disconnect();
          scriptNode.disconnect();
          stream.getTracks().forEach((track) => track.stop());
        }

        if (this.ws) {
          if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
          }
          this.ws = null;
        }

        if (this.audioContext) {
          this.audioContext.close().catch(console.error);
          this.audioContext = null;
        }

        this.onResultCallback = null;
        this.isRecording = false;
        this.accumulatedText = "";
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
      // 确保发送最后的文本
      if (this.accumulatedText && this.accumulatedText !== this.lastSentText) {
        this.sendTextImmediately(this.accumulatedText);
      }

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
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.cleanup();
    }
  }
}

export default SpeechRecognitionService;
