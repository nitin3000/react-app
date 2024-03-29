package com.lord.data.users;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import 
org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class WebSecurityConfig  {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
}
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception 
{
        http.authorizeHttpRequests((authz)->authz.requestMatchers("/built/**", "/main.css").permitAll()
        		.anyRequest().authenticated()
        		)
        .formLogin(form -> form.defaultSuccessUrl("/", true)
        		.permitAll())
        .csrf( csrf -> csrf.disable())
        .logout(logout -> logout.permitAll())        
        ;
        return http.build();
}
}