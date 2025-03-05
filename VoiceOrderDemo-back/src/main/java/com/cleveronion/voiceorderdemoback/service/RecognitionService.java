package com.cleveronion.voiceorderdemoback.service;

import com.cleveronion.voiceorderdemoback.dto.OrderInfo;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RecognitionService {

    private final ChatLanguageModel chatLanguageModel;
    private final OrderParser orderParser;
    private final Map<String, OrderInfo> textCache = new ConcurrentHashMap<>();
    private long totalCalls = 0;
    private long totalTime = 0;

    @Autowired
    public RecognitionService(ChatLanguageModel chatLanguageModel) {
        this.chatLanguageModel = chatLanguageModel;
        this.orderParser = AiServices.create(OrderParser.class, chatLanguageModel);
    }

    @Cacheable(value = "orderInfoCache", key = "#text")
    public OrderInfo parseRecognitionText(String text) {
        try {
            // 检查缓存
            if (textCache.containsKey(text)) {
                log.info("命中缓存，直接返回结果，文本：{}", text);
                return textCache.get(text);
            }

            // 如果文本太短，直接返回空结果
            if (text.length() < 5) {
                log.info("文本太短，跳过处理：{}", text);
                return new OrderInfo();
            }

            // 记录开始时间
            Instant start = Instant.now();
            log.info("开始调用大模型解析文本：{}", text);

            // 解析文本
            OrderInfo result = orderParser.parseOrder(text);
            
            // 计算耗时
            Duration duration = Duration.between(start, Instant.now());
            totalCalls++;
            totalTime += duration.toMillis();
            double avgTime = (double) totalTime / totalCalls;
            
            log.info("大模型调用完成 - 耗时: {}ms, 总调用次数: {}, 平均耗时: {:.2f}ms, 文本: {}", 
                duration.toMillis(), totalCalls, avgTime, text);
            
            // 存入缓存
            textCache.put(text, result);
            
            // 清理缓存（保持缓存大小在合理范围内）
            if (textCache.size() > 1000) {
                log.info("缓存达到上限，清理缓存");
                textCache.clear();
            }
            
            return result;
        } catch (Exception e) {
            log.error("解析文本失败：{}", text, e);
            return new OrderInfo();
        }
    }

    interface OrderParser {
        @SystemMessage("""
            你是一个订单信息提取助手。你需要从用户的语音识别文本中提取关键订单信息。
            请尽可能快速地完成以下任务：
            
            只需要提取以下信息：
            1. 客户姓名
            2. 产品信息：名称和数量
            3. 司机姓名
            
            请将提取的信息组织成JSON格式返回，格式如下：
            {
                "customerInfo": {
                    "name": "客户姓名"
                },
                "productInfo": {
                    "name": "产品名称",
                    "quantity": 数字类型的数量
                },
                "driverInfo": {
                    "name": "司机姓名"
                }
            }
            
            注意：
            1. 只提取上述指定的字段，不要添加其他信息
            2. 如果某个信息未提供，对应字段返回null
            3. 保持JSON格式的完整性
            4. 即使输入文本不完整，也要返回完整的JSON结构
            5. 数字必须是数字类型，不要加引号
            6. 所有字符串值都要加引号
            7. 尽可能快速地完成提取，不要过度分析
            
            示例输入：
            "客户张三要买5个苹果"
            
            示例输出：
            {
                "customerInfo": {
                    "name": "张三"
                },
                "productInfo": {
                    "name": "苹果",
                    "quantity": 5
                },
                "driverInfo": {
                    "name": null
                }
            }
            """)
        OrderInfo parseOrder(String text);
    }
}