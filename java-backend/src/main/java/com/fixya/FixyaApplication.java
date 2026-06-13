package com.fixya;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FixyaApplication {

    private static final Logger log = LoggerFactory.getLogger(FixyaApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(FixyaApplication.class, args);
        log.info("=== FixYa Backend Java/Spring Boot iniciado en puerto 8081 ===");
    }
}
