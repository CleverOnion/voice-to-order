package com.cleveronion.voiceorderdemoback.repository;

import com.cleveronion.voiceorderdemoback.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
} 