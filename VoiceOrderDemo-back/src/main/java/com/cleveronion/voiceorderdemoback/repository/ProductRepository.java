package com.cleveronion.voiceorderdemoback.repository;

import com.cleveronion.voiceorderdemoback.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
} 