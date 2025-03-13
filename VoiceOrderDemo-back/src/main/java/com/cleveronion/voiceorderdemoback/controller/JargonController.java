package com.cleveronion.voiceorderdemoback.controller;

import com.cleveronion.voiceorderdemoback.entity.Jargon;
import com.cleveronion.voiceorderdemoback.event.JargonUpdateEvent;
import com.cleveronion.voiceorderdemoback.repository.JargonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jargons")
@RequiredArgsConstructor
public class JargonController {
    private final JargonRepository jargonRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping
    public Page<Jargon> list(Pageable pageable) {
        return jargonRepository.findAll(pageable);
    }

    @PostMapping
    public Jargon create(@RequestBody Jargon jargon) {
        Jargon saved = jargonRepository.save(jargon);
        eventPublisher.publishEvent(new JargonUpdateEvent(this, "新增黑话映射"));
        return saved;
    }

    @PutMapping("/{id}")
    public Jargon update(@PathVariable Long id, @RequestBody Jargon jargon) {
        jargon.setId(id);
        Jargon updated = jargonRepository.save(jargon);
        eventPublisher.publishEvent(new JargonUpdateEvent(this, "更新黑话映射"));
        return updated;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        jargonRepository.deleteById(id);
        eventPublisher.publishEvent(new JargonUpdateEvent(this, "删除黑话映射"));
    }
} 