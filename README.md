<h1 align="center">Masari | مساري</h1>

<p align="center">
  <strong>مساري — مرشدك المهني لمسارك الصحيح</strong>
</p>

<p align="center">
  Understand your learning needs, build stronger skills, and explore your future.
</p>

<p align="center">
  AI Tutor · Personalized Learning Plans · Career Exploration
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-F59E0B?style=for-the-badge" alt="In Development" />
  <img src="https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 📖 About

**Masari — مساري** is an Arabic-first learning and career exploration platform built for a hackathon.

It helps students understand their current skills, follow a personalized learning plan, practice mathematics, track school grades, and explore possible career paths.

An AI assistant supports students through explanations, hints, study guidance, and suggested practice tasks.

Masari provides educational guidance. Its career suggestions are options to explore, not decisions about a student's future.

> **Development status:** Core learning APIs, authentication, profiles, conversation storage, Gemini integration, and school grade features are implemented in the current development branch. Remaining frontend integration, final acceptance testing, and production deployment are still in progress. Features may reach `main` through separate pull requests.

## 🎯 Hackathon Scope

The initial learning content focuses on three mathematics skills:

- Fractions
- Equations
- Percentages

Career exploration currently includes:

- Engineering
- Computer Science

Student profiles support grades **1–12**, but the current question bank targets secondary-school mathematics. Supporting a grade in the profile does not mean its full curriculum is available.

Outside the current scope:

- Complete coverage of every school subject and grade
- Official school assessments or certified career recommendations
- Parent, teacher, and school administration dashboards
- Voice conversations and document uploads
- Payments and subscriptions
- Native mobile applications

## ✨ Features and Current Status

| Area | Implemented | Remaining work |
| --- | --- | --- |
| Authentication | Supabase registration, login, authenticated requests, and protected frontend routes | Final production authentication checks |
| Student profile | Name, grade level, learning goal, and daily study time | Final integrated UX review |
| Diagnostic assessment | Assigned questions, server-side grading, and per-skill results | Full acceptance testing |
| Learning plans | Plans based on skill results and prerequisites | Final integration testing |
| Practice and progress | Practice attempts, task updates, and progress API | Complete progress page integration |
| AI tutoring | Gemini responses, saved conversations, and suggested tasks | Complete chat UI integration and failure-state testing |
| Career exploration | Curated content and career paths API | Complete career page integration |
| School grades | Create, list, and update grades, with a frontend form | Confirm the complete editing flow |
| Deployment | Environment configuration and startup validation | Publish and test the production application |

## 🧭 Student Journey

```text
Create an account
  → Complete your profile
  → Take a diagnostic assessment
  → Receive a personalized learning plan
  → Practice weaker skills
  → Ask the AI tutor for help
  → Add useful suggested tasks to your plan
  → Review progress and school grades
  → Explore potential career paths
```

## 🛠️ Technology Stack

| Layer | Technology |
| --- | --- |
| Language | JavaScript with ES modules |
| Frontend | React + Vite |
| Routing | React Router |
| Frontend state | React hooks and context |
| Styling | CSS with Arabic and RTL support |
| HTTP client | Axios |
| Backend | Node.js + Express |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Data access control | PostgreSQL grants and Row Level Security |
| Validation | Zod |
| AI provider | Google Gemini |
| HTTP security | Helmet + CORS |
| Chat request limits | express-rate-limit |
| Automated tests | Vitest |
| Frontend linting | ESLint |
| Local development | concurrently |

The project uses **JavaScript**, not TypeScript.

## 🏗️ Architecture

```text
React application
    │
    ├── Supabase Auth
    │       └── User session and access token
    │
    └── Express REST API
            │
            ├── Authentication and request validation
            ├── Ownership checks and learning rules
            ├── Supabase PostgreSQL
            │       ├── Student-scoped access with RLS
            │       └── Restricted server-side operations
            │
            └── Google Gemini
                    └── Validated tutor response
                            └── Saved assistant message
```

- The client sends the student's access token with protected API requests.
- The backend validates authentication, ownership, and request data.
- Student-scoped database requests are subject to RLS.
- Privileged credentials are restricted to the backend.
- Grading uses server-only answer keys.
- The backend validates AI output before saving it.
- The frontend never receives the Gemini API key or Supabase server key.

## 📂 Project Structure

```text
Masari/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── context/
│   │   ├── locales/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── scripts/
│   ├── src/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   └── chat/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── supabase/
│   ├── migrations/
│   ├── tests/
│   └── seed.sql
│
├── docs/
│   └── ai-eval/
│       └── results/
│
├── .gitignore
├── package.json
└── README.md
```

The GitHub repository directory is currently named `Masari`; the product name is **Masari**.

## 🚀 Getting Started

### 1. Prerequisites

- Node.js and npm compatible with the project's Vite version
- A Supabase project
- A Gemini API key for real AI responses
- Git

Use a consistent Node.js version across the team.

### 2. Clone the repository

```bash
git clone https://github.com/MDBASHERx/Masari.git
cd Masari
```

### 3. Install dependencies

Run from the repository root:

```bash
npm ci
npm ci --prefix client
npm ci --prefix server
```

### 4. Configure environment files

Copy:

```text
client/.env.example → client/.env
server/.env.example → server/.env
```

Example client configuration:

```ini
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_USE_MOCK_LEARNING=false
```

Example server configuration:

```ini
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVER_KEY=YOUR_SERVER_SECRET_KEY

CLIENT_URL=http://localhost:5173

LLM_PROVIDER=gemini
LLM_API_KEY=YOUR_GEMINI_API_KEY
LLM_MODEL=gemini-3.5-flash-lite
AI_TIMEOUT_MS=30000
AI_MAX_CONCURRENT=2

CHAT_DEMO_ENABLED=false
```

Important configuration notes:

- Use plain URLs, without Markdown link syntax.
- `CLIENT_URL` must match the frontend origin.
- Both applications must use the same Supabase project.
- `VITE_` variables are included in the frontend bundle and must contain only public configuration.
- Keep the Supabase server key and Gemini API key in `server/.env`.
- Never commit real `.env` files.
- Restart development processes after changing environment variables.
- Production frontend environment changes require a new build.

### 5. Prepare Supabase

From the repository root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run --include-all
```

Review the pending migrations before applying them:

```bash
npx supabase db push --include-all
```

For a new development database, run `supabase/seed.sql` through the Supabase SQL Editor after applying migrations.

The seed provides the initial skills, questions, and grading data.

For an existing shared project:

- Coordinate database changes with the team.
- Check migration history before applying changes.
- If SQL was applied manually, verify the complete migration before marking it as applied.
- Do not reset the shared database as a setup shortcut.

Configure Supabase Auth URLs and email confirmation settings for the environment being used.

### 6. Start the application

```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:5000/api |
| Health endpoint | http://localhost:5000/api/health |

The health endpoint confirms that Express responds. It does not independently verify database access or Gemini availability.

## 📜 Available Commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend and backend |
| `npm run client` | Start the frontend |
| `npm run server` | Start the backend |
| `npm run build` | Build the frontend |
| `npm start` | Start the backend without watch mode |
| `npm run lint --prefix client` | Run frontend linting |
| `npm test --prefix server` | Run backend tests |
| `npm run eval:ai --prefix server` | Evaluate the configured AI provider |
| `git diff --check` | Check changes for whitespace errors |

`npm start` starts the API only. Hosting the frontend requires serving `client/dist` separately.

## 🗄️ Data Model

| Entity | Purpose |
| --- | --- |
| Profiles | Student name, grade, goal, and daily study time |
| Skills | Supported learning skills and prerequisites |
| Questions | Learning questions and answer options |
| Attempts | Diagnostic and practice sessions |
| Attempt items | Assigned questions and submitted answers |
| Learning plans | Plans generated from assessment results |
| Plan tasks | Practice tasks and completion status |
| Conversations | Student-owned tutor and mentor conversations |
| Messages | Student messages, assistant replies, and suggested tasks |
| Grades | Student-entered school grades |

Answer keys are restricted grading data and must not be exposed to the client.

School grades are entered by students. They are separate from diagnostic scores calculated by the learning engine.

Career paths are currently curated JSON content.

## 🔌 Main API Endpoints

Protected requests use:

```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| GET | `/api/me/profile` | Read the current student's profile |
| PATCH | `/api/me/profile` | Update the profile |
| POST | `/api/attempts` | Start or resume an assessment or practice attempt |
| GET | `/api/attempts/:id` | Retrieve an attempt |
| POST | `/api/attempts/:id/submit` | Submit answers for grading |
| POST | `/api/plans` | Create a learning plan |
| GET | `/api/plans/current` | Retrieve the current plan |
| POST | `/api/plans/:id/tasks` | Add a task to a plan |
| PATCH | `/api/tasks/:id` | Update task status |
| GET | `/api/progress` | Retrieve learning progress |
| GET | `/api/career-paths` | Retrieve curated career paths |
| GET | `/api/conversations` | List the student's conversations |
| POST | `/api/conversations` | Create a conversation |
| GET | `/api/conversations/:id/messages` | Retrieve conversation messages |
| POST | `/api/conversations/:id/messages` | Save a message and request an AI reply |
| GET | `/api/grades` | List school grades |
| POST | `/api/grades` | Create a school grade |
| PATCH | `/api/grades/:id` | Edit a school grade |

Grade updates currently expect the complete editable form payload. Grade deletion is not implemented.

## 💬 AI Chat and Retry Behavior

A student message includes its content and a client-generated request ID:

```json
{
  "content": "ساعدني على فهم جمع الكسور خطوة بخطوة",
  "requestId": "YOUR_UUID"
}
```

A successful request can return:

```json
{
  "success": true,
  "created": true,
  "message": {},
  "assistantMessage": {},
  "assistantCreated": true,
  "isDemo": false
}
```

- `created` indicates whether a new student message was inserted.
- `assistantCreated` indicates whether a new assistant reply was inserted.
- Repeating the same request ID and content returns the saved messages.
- Reusing a request ID with different content returns a conflict.
- If the student message was saved but AI generation failed, retry with the same content and request ID.
- Do not create a new request ID merely because a request timed out.
- Historical replies may return `isDemo: null` when provider metadata was not persisted.

An assistant may suggest a task:

```json
{
  "title": "تدريب على توحيد المقامات",
  "skillId": "fractions",
  "minutes": 10
}
```

The suggestion is stored with the assistant message. It becomes a plan task only when the student chooses to add it.

The plan task request uses its own request ID, reused when retrying the same addition.

### Capacity controls

The current implementation includes:

- A limit of 10 chat send requests per student per minute
- A configurable maximum number of simultaneous AI generations
- A provider timeout
- Structured errors for busy, rate-limited, and unavailable services

The default AI concurrency is `2`.

Request counters and concurrency controls are currently held in memory per server process. Multiple server instances would require coordinated limits.

These controls do not establish a verified concurrent-user capacity; load testing remains pending.

## 🔐 Security and Data Boundaries

- Protected API requests validate the Supabase access token.
- Ownership checks restrict access to student data.
- Database RLS and grants restrict permitted operations.
- The backend derives student identity from authentication.
- Assessment scores are calculated from server-side answer keys.
- Client-supplied grading claims are not trusted.
- AI output is validated before persistence.
- Student messages and profile text are treated as untrusted AI context.
- Privileged keys remain on the server.
- Helmet and request body limits are enabled.
- CORS is configured for the frontend origin.
- Production configuration rejects mock AI and the demo reply endpoint.

The AI tutor supports learning; it does not issue official school grades or make binding career decisions.

## 🧪 Testing and AI Evaluation

Run backend tests:

```bash
npm test --prefix server
```

Run frontend checks:

```bash
npm run lint --prefix client
npm run build --prefix client
```

Evaluate the real AI provider:

```bash
npm run eval:ai --prefix server
```

The AI evaluation covers:

- Explanations of fractions, equations, and percentages
- Hints that leave work for the student
- Feedback on mathematical mistakes
- Study organization
- Off-topic handling
- Prompt injection through messages and profile goals

Latest recorded successful evaluation on September 30, 2026:

| Metric | Result |
| --- | --- |
| Provider | Gemini |
| Model | `gemini-3.5-flash-lite` |
| Cases passed | 12 / 12 |
| Checks passed | 40 / 40 |
| Provider errors | 0 |
| Median latency | 1,238 ms |
| P90 latency | 1,536 ms |

See the [evaluation report](docs/ai-eval/results/gemini-gemini-3.5-flash-lite-2026-09-30-19-07.md).

This is one recorded evaluation run, not a guarantee of every future response or production latency.

Real-provider evaluations consume API quota.

The previously recorded backend baseline was **109 passed and 3 skipped**. Rerun the suite after current integration changes before treating it as the branch's final result.

Database concurrency tests require a configured test database. Use an isolated test environment, not the shared production database.

## 👥 Team Ownership

| Member | Primary ownership |
| --- | --- |
| **Basher — Member 1** | Project foundation, authentication, profiles, conversation storage, AI integration, school grades, integration, and deployment |
| **Ward — Member 2** | Learning engine, assessment and plan APIs, practice, progress, career content, and AI service foundations |
| **Yousef — Member 3** | React chat, conversation history, career exploration, and progress interfaces |
| **All members** | Reviews, integration testing, documentation, and the hackathon presentation |

For the final delivery phase, Basher is also completing remaining backend and AI work originally assigned to Member 2.

## 🤝 Development Workflow

1. Update local `main`.
2. Create a feature or fix branch.
3. Keep changes focused on the assigned task.
4. Coordinate API contracts and shared files with the team.
5. Run checks relevant to the change.
6. Open a pull request with a description and validation results.
7. Resolve review feedback and merge conflicts before merging.

Example:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/your-feature
```

Shared files such as `App.jsx`, `app.js`, locale files, and environment examples need particular care during integration.

Commit migration files and `.env.example` updates with the feature. Never commit credentials.

## 🚢 Remaining Delivery Work

- Complete integration of chat, career exploration, and progress pages.
- Verify authentication and navigation after merging frontend changes.
- Confirm school grade editing persists correctly.
- Test task suggestions from chat through addition to the learning plan.
- Verify conversation ownership, retries, timeouts, and failure recovery.
- Run the full test suite, frontend lint, and production build.
- Review temporary screens, unused files, and development-only code.
- Test expected concurrent usage against hosting and provider quotas.
- Deploy the frontend and API.
- Configure production URLs, Supabase Auth redirects, and environment variables.
- Run the complete student journey on the deployed application.

For production:

- Set `NODE_ENV=production`.
- Keep `CHAT_DEMO_ENABLED=false`.
- Use a real AI provider and server-only credentials.
- Set `VITE_USE_MOCK_LEARNING=false`.
- Configure HTTPS and the exact frontend origin.
- Configure frontend hosting to support React Router navigation.
- Apply reviewed database migrations before dependent features go live.

---

<p align="center">
  <strong>Masari | مساري</strong>
  <br />
  مساري — مرشدك المهني لمسارك الصحيح
</p>