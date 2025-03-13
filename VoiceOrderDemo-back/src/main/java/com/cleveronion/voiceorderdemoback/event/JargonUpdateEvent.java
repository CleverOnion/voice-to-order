package com.cleveronion.voiceorderdemoback.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class JargonUpdateEvent extends ApplicationEvent {
    private final String message;

    public JargonUpdateEvent(Object source, String message) {
        super(source);
        this.message = message;
    }
} 