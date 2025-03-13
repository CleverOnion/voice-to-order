package com.cleveronion.voiceorderdemoback.dto;

import lombok.Data;

@Data
public class OrderInfo {
    private CustomerInfo customerInfo;
    private ProductInfo productInfo;
    private DriverInfo driverInfo;

    @Data
    public static class CustomerInfo {
        private Long id;
        private String name;
        private String phone;
        private boolean exists;
    }

    @Data
    public static class ProductInfo {
        private Long id;
        private String name;
        private Integer quantity;
        private boolean exists;
    }

    @Data
    public static class DriverInfo {
        private Long id;
        private String name;
        private String phone;
        private String licensePlate;
        private boolean exists;
    }
} 