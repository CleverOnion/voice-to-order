package com.cleveronion.voiceorderdemoback.websocket;

import com.cleveronion.voiceorderdemoback.dto.OrderInfo;
import com.cleveronion.voiceorderdemoback.service.RecognitionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RecognitionWebSocketHandler extends TextWebSocketHandler {

    private final RecognitionService recognitionService;
    private final ObjectMapper objectMapper;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, OrderInfo> sessionStates = new ConcurrentHashMap<>();

    public RecognitionWebSocketHandler(RecognitionService recognitionService, ObjectMapper objectMapper) {
        this.recognitionService = recognitionService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket连接已建立: {}", session.getId());
        sessions.put(session.getId(), session);
        sessionStates.put(session.getId(), new OrderInfo()); // 初始化空状态
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String text = message.getPayload();
            log.debug("收到语音识别文本: {}", text);

            // 获取当前会话的状态
            OrderInfo currentState = sessionStates.get(session.getId());
            if (currentState == null) {
                currentState = new OrderInfo();
                sessionStates.put(session.getId(), currentState);
            }

            // 解析新的识别文本
            OrderInfo newInfo = recognitionService.parseRecognitionText(text);

            // 合并新旧状态
            mergeOrderInfo(currentState, newInfo);

            // 发送合并后的完整状态
            String response = objectMapper.writeValueAsString(currentState);
            session.sendMessage(new TextMessage(response));
        } catch (Exception e) {
            log.error("处理WebSocket消息时发生错误", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket连接已关闭: {}", session.getId());
        sessions.remove(session.getId());
        sessionStates.remove(session.getId());
    }

    private void mergeOrderInfo(OrderInfo current, OrderInfo newInfo) {
        // 合并客户信息
        if (newInfo.getCustomerInfo() != null && newInfo.getCustomerInfo().getName() != null 
                && !newInfo.getCustomerInfo().getName().isEmpty()) {
            if (current.getCustomerInfo() == null) {
                current.setCustomerInfo(new OrderInfo.CustomerInfo());
            }
            current.getCustomerInfo().setName(newInfo.getCustomerInfo().getName());
        }

        // 合并产品信息
        if (newInfo.getProductInfo() != null) {
            if (current.getProductInfo() == null) {
                current.setProductInfo(new OrderInfo.ProductInfo());
            }
            if (newInfo.getProductInfo().getName() != null && !newInfo.getProductInfo().getName().isEmpty()) {
                current.getProductInfo().setName(newInfo.getProductInfo().getName());
            }
            if (newInfo.getProductInfo().getQuantity() != null && newInfo.getProductInfo().getQuantity() > 0) {
                current.getProductInfo().setQuantity(newInfo.getProductInfo().getQuantity());
            }
        }

        // 合并司机信息
        if (newInfo.getDriverInfo() != null && newInfo.getDriverInfo().getName() != null 
                && !newInfo.getDriverInfo().getName().isEmpty()) {
            if (current.getDriverInfo() == null) {
                current.setDriverInfo(new OrderInfo.DriverInfo());
            }
            current.getDriverInfo().setName(newInfo.getDriverInfo().getName());
        }
    }
} 