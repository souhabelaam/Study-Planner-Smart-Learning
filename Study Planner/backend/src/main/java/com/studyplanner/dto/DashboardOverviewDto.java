package com.studyplanner.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class DashboardOverviewDto {

	private long subjectCount;
	private long sessionCount;
	private double productivityScore;
	private double consistencyScore;
	private int mostActiveHour;
	private List<String> suggestions;
	private Map<String, Integer> dailyStats;
}
