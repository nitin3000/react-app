package com.lord;

import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Component
@EnableWebSocketMessageBroker
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {

	static final String MESSAGE_PREFIX = "/topic";

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		System.out.println("Register Stomp Endpoint");
		registry.addEndpoint("/payroll").withSockJS();
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker(MESSAGE_PREFIX);
		registry.setApplicationDestinationPrefixes("/app");
	}
}
