package com.lord.controllers;


import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {
	
	@RequestMapping(value = "/")
	public String index() {
	    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
	    System.out.println("username: " + auth.getName());		
		return "index";
	}

}