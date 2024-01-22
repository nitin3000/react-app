package com.lord;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = { "com.lord"})
@Configuration
@EntityScan("com.lord.data")
@EnableJpaRepositories(basePackages = { "com.lord"})
public class ReactAndSpringDataRestApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReactAndSpringDataRestApplication.class, args);
	}
}