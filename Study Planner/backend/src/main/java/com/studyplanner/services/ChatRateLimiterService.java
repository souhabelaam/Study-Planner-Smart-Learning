package com.studyplanner.services;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatRateLimiterService {

	private static final int MAX_REQUESTS = 10;
	private static final Duration WINDOW = Duration.ofMinutes(1);
	private final Map<Long, Deque<Instant>> requestsByUser = new ConcurrentHashMap<>();

	public boolean tryConsume(Long userId) {
		Deque<Instant> queue = requestsByUser.computeIfAbsent(userId, id -> new ArrayDeque<>());
		Instant now = Instant.now();
		Instant threshold = now.minus(WINDOW);
		synchronized (queue) {
			while (!queue.isEmpty() && queue.peekFirst().isBefore(threshold)) {
				queue.pollFirst();
			}
			if (queue.size() >= MAX_REQUESTS) {
				return false;
			}
			queue.addLast(now);
			return true;
		}
	}
}

