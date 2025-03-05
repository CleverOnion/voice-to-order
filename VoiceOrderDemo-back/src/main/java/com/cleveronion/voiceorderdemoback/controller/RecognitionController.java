package com.cleveronion.voiceorderdemoback.controller;


import com.cleveronion.voiceorderdemoback.dto.OrderInfo;

import com.cleveronion.voiceorderdemoback.service.RecognitionService;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.MediaType;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/recognition")
public class RecognitionController {

    private final RecognitionService recognitionService;

    public RecognitionController(RecognitionService recognitionService) {
        this.recognitionService = recognitionService;
    }


    @PostMapping(value = "/process")
    public ResponseEntity<OrderInfo> processRecognitionText(@RequestBody String text) {
        log.info("收到语音识别文本: {}", text);
        try {
            OrderInfo orderInfo = recognitionService.parseRecognitionText(text);
            return ResponseEntity.ok(orderInfo);
        } catch (Exception e) {
            log.error("处理语音识别文本时发生错误", e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @PostMapping("/reset")
    public ResponseEntity<Void> resetState() {
        log.info("重置订单状态");
        // 如果需要，可以在 RecognitionService 中添加重置状态的方法
        return ResponseEntity.ok().build();
    }

}
