package com.cleveronion.voiceorderdemoback.dto;

import lombok.Data;

@Data
public class OrderInfo {
    private CustomerInfo customerInfo;
    private ProductInfo productInfo;
    private DriverInfo driverInfo;

    @Data
    public static class CustomerInfo {
        private String name;
    }

    @Data
    public static class ProductInfo {
        private String name;
        private Integer quantity;
    }

    @Data
    public static class DriverInfo {
        private String name;
    }
} 