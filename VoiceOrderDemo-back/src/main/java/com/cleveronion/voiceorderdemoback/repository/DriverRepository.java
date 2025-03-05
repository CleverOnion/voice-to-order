package com.cleveronion.voiceorderdemoback.repository;

import com.cleveronion.voiceorderdemoback.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
} 