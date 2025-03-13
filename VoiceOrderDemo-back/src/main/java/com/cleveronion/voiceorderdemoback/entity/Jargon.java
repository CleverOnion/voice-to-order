package com.cleveronion.voiceorderdemoback.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "jargons")
public class Jargon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jargon_name", nullable = false)
    private String jargonName;

    @Column(name = "origin_name", nullable = false)
    private String originName;
}
