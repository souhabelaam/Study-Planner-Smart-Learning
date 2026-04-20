package com.studyplanner.rest;

import com.studyplanner.dto.ProductivityReport;
import com.studyplanner.services.StatsService;
import com.studyplanner.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsRestController {

	private final StatsService statsService;
	private final UserService userService;

	@GetMapping("/daily")
	public Map<String, Integer> daily() {
		return statsService.getDailyTotals(userService.getCurrentUser(), 7);
	}

	@GetMapping("/weekly")
	public Map<String, Integer> weekly() {
		return statsService.getWeeklyTotals(userService.getCurrentUser(), 8);
	}

	@GetMapping("/ai-report")
	public ProductivityReport report() {
		return statsService.buildAiReport(userService.getCurrentUser());
	}
}

