package com.cleveronion.voiceorderdemoback.config;

import com.cleveronion.voiceorderdemoback.websocket.RecognitionWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final RecognitionWebSocketHandler recognitionWebSocketHandler;

    public WebSocketConfig(RecognitionWebSocketHandler recognitionWebSocketHandler) {
        this.recognitionWebSocketHandler = recognitionWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(recognitionWebSocketHandler, "/ws/recognition")
                .setAllowedOrigins("*");
    }
} 