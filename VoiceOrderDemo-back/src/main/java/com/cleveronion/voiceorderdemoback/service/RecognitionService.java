package com.cleveronion.voiceorderdemoback.service;

import com.cleveronion.voiceorderdemoback.dto.OrderInfo;
import com.cleveronion.voiceorderdemoback.entity.Customer;
import com.cleveronion.voiceorderdemoback.entity.Driver;
import com.cleveronion.voiceorderdemoback.entity.Jargon;
import com.cleveronion.voiceorderdemoback.entity.Product;
import com.cleveronion.voiceorderdemoback.event.JargonUpdateEvent;
import com.cleveronion.voiceorderdemoback.repository.CustomerRepository;
import com.cleveronion.voiceorderdemoback.repository.DriverRepository;
import com.cleveronion.voiceorderdemoback.repository.ProductRepository;
import com.cleveronion.voiceorderdemoback.repository.JargonRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.HashMap;

@Slf4j
@Service
public class RecognitionService {

    private final ChatLanguageModel chatLanguageModel;
    private final OrderParser orderParser;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final ProductRepository productRepository;
    private final JargonRepository jargonRepository;
    private final Map<String, OrderInfo> textCache = new ConcurrentHashMap<>();
    private final Map<String, String> slangMapping = new HashMap<>();
    private long totalCalls = 0;
    private long totalTime = 0;

    @Autowired
    public RecognitionService(ChatLanguageModel chatLanguageModel,
                            CustomerRepository customerRepository,
                            DriverRepository driverRepository,
                            ProductRepository productRepository,
                            JargonRepository jargonRepository) {
        this.chatLanguageModel = chatLanguageModel;
        this.customerRepository = customerRepository;
        this.driverRepository = driverRepository;
        this.productRepository = productRepository;
        this.jargonRepository = jargonRepository;
        this.orderParser = AiServices.create(OrderParser.class, chatLanguageModel);
        loadJargonMapping();
    }

    @PostConstruct
    public void loadJargonMapping() {
        try {
            slangMapping.clear();
            List<Jargon> jargons = jargonRepository.findAll();
            for (Jargon jargon : jargons) {
                slangMapping.put(jargon.getJargonName(), jargon.getOriginName());
            }
            log.info("已加载{}个黑话映射", slangMapping.size());
        } catch (Exception e) {
            log.error("加载黑话映射失败", e);
        }
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
            if (text == null || text.trim().length() < 2) {
                log.info("文本为空或太短，跳过处理：{}", text);
                return new OrderInfo();
            }

            // 替换黑话
            String processedText = replaceSlang(text.trim());
            log.info("黑话替换后的文本：{}", processedText);

            // 记录开始时间
            Instant start = Instant.now();
            log.info("开始调用大模型解析文本：{}", processedText);

            // 解析文本
            OrderInfo result;
            try {
                result = orderParser.parseOrder(processedText);
                if (result == null) {
                    log.warn("大模型返回null结果，创建空OrderInfo");
                    return new OrderInfo();
                }
            } catch (Exception e) {
                log.error("大模型解析失败：{}", e.getMessage());
                return new OrderInfo();
            }
            
            // 如果识别出客户名，查询完整信息
            if (result.getCustomerInfo() != null && result.getCustomerInfo().getName() != null) {
                enrichCustomerInfo(result);
            }

            // 如果识别出产品名，查询完整信息
            if (result.getProductInfo() != null && result.getProductInfo().getName() != null) {
                enrichProductInfo(result);
            }

            // 如果识别出司机名，查询完整信息
            if (result.getDriverInfo() != null && result.getDriverInfo().getName() != null) {
                enrichDriverInfo(result);
            }
            
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

    private String replaceSlang(String text) {
        String result = text;
        for (Map.Entry<String, String> entry : slangMapping.entrySet()) {
            result = result.replace(entry.getKey(), entry.getValue());
        }
        return result;
    }

    private void enrichCustomerInfo(OrderInfo orderInfo) {
        String customerName = orderInfo.getCustomerInfo().getName();
        Optional<Customer> customerOpt = customerRepository.findByName(customerName);
        
        OrderInfo.CustomerInfo customerInfo = orderInfo.getCustomerInfo();
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            customerInfo.setId(customer.getId());
            customerInfo.setPhone(customer.getPhone());
            customerInfo.setExists(true);
        } else {
            customerInfo.setExists(false);
            // 保留名字，其他信息设为null
            customerInfo.setId(null);
            customerInfo.setPhone(null);
        }
    }

    private void enrichDriverInfo(OrderInfo orderInfo) {
        String driverName = orderInfo.getDriverInfo().getName();
        Optional<Driver> driverOpt = driverRepository.findByName(driverName);
        
        OrderInfo.DriverInfo driverInfo = orderInfo.getDriverInfo();
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            driverInfo.setId(driver.getId());
            driverInfo.setPhone(driver.getPhone());
            driverInfo.setLicensePlate(driver.getLicensePlate());
            driverInfo.setExists(true);
        } else {
            driverInfo.setExists(false);
            // 保留名字，其他信息设为null
            driverInfo.setId(null);
            driverInfo.setPhone(null);
            driverInfo.setLicensePlate(null);
        }
    }

    private void enrichProductInfo(OrderInfo orderInfo) {
        String productName = orderInfo.getProductInfo().getName();
        Optional<Product> productOpt = productRepository.findByName(productName);
        
        OrderInfo.ProductInfo productInfo = orderInfo.getProductInfo();
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            productInfo.setId(product.getId());
            productInfo.setExists(true);
        } else {
            productInfo.setExists(false);
            // 保留名字和数量，其他信息设为null
            productInfo.setId(null);
        }
    }

    /**
     * 手动刷新黑话映射
     * 可以通过API调用此方法来更新黑话映射
     */
    public void refreshJargonMapping() {
        try {
            log.info("开始刷新黑话映射");
            slangMapping.clear();
            List<Jargon> jargons = jargonRepository.findAll();
            for (Jargon jargon : jargons) {
                slangMapping.put(jargon.getJargonName(), jargon.getOriginName());
            }
            log.info("黑话映射刷新完成，当前共有{}个映射", slangMapping.size());
        } catch (Exception e) {
            log.error("刷新黑话映射失败", e);
            throw new RuntimeException("刷新黑话映射失败", e);
        }
    }

    @EventListener(JargonUpdateEvent.class)
    public void handleJargonUpdate(JargonUpdateEvent event) {
        log.info("收到黑话更新事件，开始刷新映射");
        refreshJargonMapping();
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