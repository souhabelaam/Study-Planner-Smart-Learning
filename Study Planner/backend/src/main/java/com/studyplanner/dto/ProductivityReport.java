package com.studyplanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductivityReport {
	private int mostActiveHour;
	private double consistencyScore;
	private double productivityScore;
	private List<String> suggestions;
}

