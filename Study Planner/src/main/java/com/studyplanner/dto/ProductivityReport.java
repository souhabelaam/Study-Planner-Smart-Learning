package com.studyplanner.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProductivityReport {
	private int mostActiveHour;
	private double consistencyScore;
	private double productivityScore;
	private List<String> suggestions;
}

