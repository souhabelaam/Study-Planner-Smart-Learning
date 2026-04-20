package com.studyplanner.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

	@GetMapping({"/", "/login", "/register", "/dashboard", "/subjects", "/sessions", "/stats"})
	public String forwardSpaRoutes() {
		return "forward:/index.html";
	}
}
