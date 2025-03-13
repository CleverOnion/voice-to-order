package com.cleveronion.voiceorderdemoback.service;

import com.cleveronion.voiceorderdemoback.entity.Jargon;
import com.cleveronion.voiceorderdemoback.repository.JargonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class JargonService {
    private final JargonRepository jargonRepository;

    @Autowired
    public JargonService(JargonRepository jargonRepository) {
        this.jargonRepository = jargonRepository;
    }

    @Transactional
    public Jargon createJargon(Jargon jargon) {
        return jargonRepository.save(jargon);
    }

    public List<Jargon> getAllJargons() {
        return jargonRepository.findAll();
    }

    public Page<Jargon> getJargonsByPage(Pageable pageable) {
        return jargonRepository.findAll(pageable);
    }

    public Jargon getJargonById(Long id) {
        return jargonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("行话未找到: " + id));
    }

    @Transactional
    public Jargon updateJargon(Long id, Jargon jargon) {
        Jargon existingJargon = getJargonById(id);
        existingJargon.setJargonName(jargon.getJargonName());
        existingJargon.setOriginName(jargon.getOriginName());
        return jargonRepository.save(existingJargon);
    }

    @Transactional
    public void deleteJargon(Long id) {
        jargonRepository.deleteById(id);
    }
} 