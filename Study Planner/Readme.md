# Study Planner

Study Planner is a full-stack learning planner with:
- Spring Boot backend (REST API + security)
- Angular frontend (SPA)
- MySQL database
- Gemini-powered chat assistant

## Current stack

- Java 17+
- Spring Boot 4
- Spring Security + JWT
- Spring Data JPA / Hibernate
- MySQL 8
- Angular 21
- Maven
- Docker Compose

## Important status

- MongoDB is not used in runtime.
- H2 is not used in runtime or test configuration.
- Tests are configured for MySQL test database.

## Gemini chat setup (persistent across runs)

The app now loads env values from a local `.env` file, so you set your Gemini key once and keep it for every run.

1. Copy `.env.example` to `.env`
2. Set your real `GEMINI_API_KEY`
3. Restart the app

Example:

```env
GEMINI_API_KEY=your_real_key
GEMINI_MODEL=gemini-2.0-flash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=studyplanner
MYSQL_USER=root
MYSQL_PASSWORD=root
```

If Gemini is not configured, `/api/chat` returns a clear setup message.
If startup fails with `Access denied for user`, update `MYSQL_USER` and `MYSQL_PASSWORD` in `.env` and restart.

## Run with Docker

```bash
docker compose up --build -d
```

Open:
- http://localhost:8080
- Health: http://localhost:8080/actuator/health

## Run locally

Prerequisites:
- MySQL running on localhost:3306
- Credentials matching `src/main/resources/application.properties`

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## Main config files

- `src/main/resources/application.properties`
- `src/main/resources/application-docker.properties`
- `src/test/resources/application-test.properties`
- `docker-compose.yml`
- `.env.example`

## Chat endpoint

- `POST /api/chat`
- Requires authenticated user session
- Uses Gemini API when configured

## Build and test

```bash
./mvnw test
```

Windows:

```powershell
.\mvnw.cmd test
```
