
## Study Planner — Smart Learning Analyzer

Full-stack study planner with analytics + an AI study coach.

### Tech
- Backend: Java 21, Spring Boot, MySQL, JWT
- Frontend: Angular
- Dev: Docker Compose

### Setup (local)
1. Create your env file:
   - Copy `Study Planner/.env.example` → `Study Planner/.env`
2. Put your Gemini API key in `Study Planner/.env`:
   - Get a key at `https://aistudio.google.com/app/apikey`

### Run (Docker backend)
From `Study Planner/`:

```bash
docker compose up -d --build
