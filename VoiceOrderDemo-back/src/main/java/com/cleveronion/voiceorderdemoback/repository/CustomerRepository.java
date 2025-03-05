package com.cleveronion.voiceorderdemoback.repository;

import com.cleveronion.voiceorderdemoback.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
} 