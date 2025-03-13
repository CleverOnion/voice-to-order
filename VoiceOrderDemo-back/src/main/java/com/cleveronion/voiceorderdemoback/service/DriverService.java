package com.cleveronion.voiceorderdemoback.service;

import com.cleveronion.voiceorderdemoback.entity.Driver;
import com.cleveronion.voiceorderdemoback.exception.ResourceNotFoundException;
import com.cleveronion.voiceorderdemoback.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverService {
    private final DriverRepository driverRepository;

    @Autowired
    public DriverService(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    @Transactional
    public Driver createDriver(Driver driver) {
        return driverRepository.save(driver);
    }

    public Page<Driver> getAllDrivers(Pageable pageable) {
        return driverRepository.findAll(pageable);
    }

    public Driver getDriverById(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("司机未找到: " + id));
    }

    @Transactional
    public Driver updateDriver(Driver driver) {
        if (!driverRepository.existsById(driver.getId())) {
            throw new ResourceNotFoundException("司机未找到: " + driver.getId());
        }
        return driverRepository.save(driver);
    }

    @Transactional
    public void deleteDriver(Long id) {
        if (!driverRepository.existsById(id)) {
            throw new ResourceNotFoundException("司机未找到: " + id);
        }
        driverRepository.deleteById(id);
    }
} 