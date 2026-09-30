<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Cairo&amp;size=30&amp;pause=1000&amp;color=7950D6&amp;center=true&amp;vCenter=true&amp;width=850&amp;lines=Masari;AI+Personal+Teacher+%26+Learning+Path;Discover+%7C+Plan+%7C+Learn+%7C+Grow" alt="Masari - AI Personal Teacher and Learning Path" />
</p>

<p align="center">
  A personal learning journey that connects a student's goals to their next study step.
  <br />
  Arabic-First Learning Experience · Full-Stack Hackathon Project
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Design%20%26%20Prototyping-F59E0B?style=for-the-badge" alt="Design and prototyping" />
  <img src="https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&amp;logo=javascript&amp;logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&amp;logo=supabase&amp;logoColor=white" alt="Supabase PostgreSQL" />
  <img src="https://img.shields.io/badge/UI-Arabic%20%2B%20RTL-38BDF8?style=for-the-badge" alt="Arabic and RTL" />
</p>

---

## 📖 About

**Masari** is a student-focused platform combining diagnostic assessments, personalized learning paths, an AI tutor, and study guidance.

Students often know their marks but do not know which skills need attention or what to study next. Masari aims to turn that uncertainty into a practical next step.

A student sets a goal, completes a short assessment, receives a skill-based plan, and learns through guided practice and chat. Their learning history helps shape the next activity.

> **Development status:** Interactive UI prototypes and design documents have been prepared. Authentication, database integration, persistent chat, and live AI are planned implementation work. Prototype replies and student records are demonstration data, not a working production service.

## 🎯 Version 1 Scope

The first release focuses on **secondary-school students**, **mathematics**, and **one complete learning journey**.

### Included

- Student accounts and learning preferences.
- Three initial skills: fractions, equations, and percentages.
- A short diagnostic using reviewed questions.
- A study plan based on results and available time.
- Tutor and study-mentor chat modes.
- Guided practice with server-side grading.
- Saved conversations, plans, and progress.
- Self-reported school marks.
- Initial exploration of engineering and computer science.

### Outside the Initial Scope

- Every subject and full curriculum coverage.
- Parent, teacher, and school administration dashboards.
- School information-system integrations.
- Voice chat, OCR, and handwritten-answer grading.
- Native mobile applications and payments.
- Autonomous agents with unrestricted database access.
- Final career decisions or university admission predictions.

Career suggestions are options to explore, not decisions made on behalf of a student.

## 🔄 Student Journey

```text
Create an account
  → Set interests, goal, and daily study time
  → Complete a diagnostic assessment
  → Receive a prioritized learning plan
  → Ask the tutor for an explanation or hint
  → Complete guided practice
  → Review saved progress and the next step
```

The primary success condition is a complete journey with persisted data and correct ownership checks.

## ✨ Planned Features

| Feature | Intended behavior |
| --- | --- |
| **Authentication** | Register, sign in, and sign out through Supabase Auth |
| **Learning profile** | Save grade level, interests, goal, time, and explanation preferences |
| **Diagnostic assessment** | Identify skills needing practice using reviewed questions |
| **Personal learning path** | Prioritize skills and fit tasks to available time |
| **AI tutor** | Explain concepts, provide examples, and offer hints |
| **Study mentor** | Help organize study time and explore future options |
| **Guided practice** | Grade supported exercises on the server and store results |
| **Conversation history** | Save and restore the student's own chat sessions |
| **Chat-to-plan tasks** | Add a suggested task after the student accepts it |
| **Progress tracking** | Summarize diagnostic results and completed practice |
| **School marks** | Store manually entered marks separately from practice results |
| **Career exploration** | Present curated pathways and practical activities |
| **Responsive UI** | Support Arabic, RTL, keyboard navigation, and mobile layouts |

Completing a task or sending a message does not automatically establish mastery. School marks and diagnostic results remain distinct.

## 🛠️ Technology Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&amp;logo=react&amp;logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&amp;logo=javascript&amp;logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&amp;logo=vite&amp;logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&amp;logo=express&amp;logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&amp;logo=supabase&amp;logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&amp;logo=postgresql&amp;logoColor=white" alt="PostgreSQL" />
</p>

| Layer | Selected technology |
| --- | --- |
| Frontend | React + JavaScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Server-state management | TanStack Query |
| Local UI state | React state and context |
| Backend | Node.js + Express + JavaScript |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Validation | Zod |
| AI | LLM provider API through Express; provider/model to be selected |
| Testing | Vitest + Supertest + Playwright |
| Code quality | ESLint + Prettier |
| Collaboration | GitHub pull requests |

Use **`.js` and `.jsx` files** throughout the project.

### Database Decision

The design uses one PostgreSQL database in Supabase for students, skills, attempts, plans, and conversations. Supabase Auth handles sign-in. Chat history does not require a second database.

Storage, vector search, and realtime subscriptions are optional extensions rather than MVP requirements.

## 🏗️ Planned Architecture

```text
React + JavaScript
    │
    ├── Sign-in / session ───────────────► Supabase Auth
    │
    └── REST requests + access token
                    │
                    ▼
             Node.js + Express
                    │
       Verify session and ownership
       Validate input and business rules
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
  Supabase PostgreSQL     LLM Provider API
  Profiles and attempts   Explanations and hints
  Plans and messages      Validated suggestions
```

- React displays data and captures actions.
- Express verifies identity, checks ownership, and applies business rules.
- Ordinary data operations use the student's verified context and row-level security.
- Answer keys and authoritative grading remain server-controlled.
- Privileged server access that bypasses RLS still requires explicit ownership checks.
- The AI provider has no unrestricted database access.
- The database remains the source of truth.

Start with complete HTTP responses for chat. Streaming can follow after the basic flow works; Socket.IO is not required solely for an AI tutor.

## 📂 Proposed Project Structure

```text
Masari/
├── client/
│   ├── src/
│   │   ├── components/       # Shared React components (.jsx)
│   │   ├── pages/            # Feature screens (.jsx)
│   │   ├── hooks/            # React hooks (.js)
│   │   ├── context/          # Session and shared UI context
│   │   ├── services/         # API helpers (.js)
│   │   └── App.jsx
│   └── .env.example
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/         # Learning rules and AI adapter
│   │   ├── repositories/     # Database access
│   │   ├── middleware/       # Authentication and ownership
│   │   └── validators/
│   ├── tests/
│   └── .env.example
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── docs/
└── README.md
```

This is the target structure, not a claim that these application files already exist.

## 🚀 Development Setup Plan

The runnable repository skeleton and package scripts are still to be finalized.

### Prerequisites

- A supported Node.js LTS release compatible with the selected dependencies.
- npm and Git.
- A Supabase development project.
- Access to the selected AI provider for live chat integration.

### Setup Sequence

1. Clone the team's shared repository once available.
2. Install dependencies using the committed lockfiles and documented scripts.
3. Copy the environment examples into local environment files.
4. Configure Supabase and apply reviewed migrations.
5. Load the reviewed skills, questions, and demonstration data.
6. Start the client and server with their defined package scripts.
7. Verify authentication, persistence, and one complete student journey.

Add exact install, seed, start, and test commands after the skeleton is implemented and verified. Commands from another project's README should not be assumed to exist here.

### Proposed Client Environment

```dotenv
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

### Proposed Server Environment

```dotenv
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Only if protected server operations need privileged access.
SUPABASE_SERVER_KEY=YOUR_SERVER_ONLY_KEY

LLM_API_KEY=YOUR_PROVIDER_KEY
LLM_MODEL=YOUR_SELECTED_MODEL
AI_TIMEOUT_MS=30000
```

Ports and timeout values are proposed local defaults. `SUPABASE_SERVER_KEY` is an application setting name for protected server access.

> Never put the AI key or privileged database keys in `VITE_*` variables, and never commit `.env` files. Supabase Auth manages sessions; do not create a parallel password/token system without an explicit design change.

## 🗄️ Planned Data Model

| Entity | Purpose |
| --- | --- |
| `profiles` | Grade level, goal, interests, available time, and preferences |
| `skills` | Learning topics and prerequisites |
| `questions` | Versioned, skill-tagged questions without exposed answer keys |
| `private.answer_keys` | Protected correct answers and grading rules |
| `attempts` | Diagnostic/practice submissions and server-computed results |
| `attempt_items` | Assigned questions, choices, and grading results |
| `learning_plans` | Plans linked to the diagnostic used to create them |
| `plan_tasks` | Ordered tasks, durations, skills, and status |
| `conversations` | Student-owned tutor or mentor sessions |
| `messages` | Content, processing status, and request identifiers |
| `grades` | Self-reported school marks |

### Data Rules

- Students access only their own private learning records.
- Messages and tasks inherit access restrictions from their parent conversation or plan.
- The server selects assigned questions and calculates results.
- Scores, correctness flags, and assistant messages are server-owned fields.
- School marks must be between `0` and `100`.
- Final submission and grading writes should be atomic.
- Request identifiers prevent duplicate writes on supported retries.
- Index ownership fields and message/task ordering fields.
- Version questions instead of changing historical answer semantics.

## 🔌 Planned API

Application endpoints require a valid session and relevant ownership checks.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `PATCH` | `/api/me/profile` | Read/update allowed profile fields |
| `POST` | `/api/attempts` | Create an assessment or practice attempt |
| `POST` | `/api/attempts/:id/submit` | Submit answers for server grading |
| `GET` | `/api/attempts/:id` | Read an owned attempt |
| `POST` | `/api/plans` | Build a plan from an owned diagnostic |
| `GET` | `/api/plans/current` | Read the current plan |
| `POST` | `/api/plans/:id/tasks` | Add a validated task |
| `PATCH` | `/api/tasks/:id` | Update permitted task fields |
| `GET`, `POST` | `/api/conversations` | List/create conversations |
| `GET`, `POST` | `/api/conversations/:id/messages` | Read history or send a message |
| `GET`, `POST` | `/api/grades` | Read/record self-reported marks |
| `GET` | `/api/progress` | Summarize saved learning evidence |
| `GET` | `/api/career-paths` | Read curated pathways |

Sign-up and login use Supabase Auth. Do not trust client-supplied `user_id`, `score`, `is_correct`, or privileged message roles.

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid answer"
  },
  "requestId": "unique-request-id"
}
```

## 🤖 AI Tutor Design

**Tutor mode** explains the current concept, uses the student's preferences, offers hints, and invites practice with reviewed questions.

**Mentor mode** helps organize study time, identify the next task, and explore future options with reasons.

```text
Student sends a message
  → Verify session, ownership, and limits
  → Save the user message with a request ID
  → Assemble limited learning context
  → Call the provider from Express
  → Validate and save the reply
  → Display the result in React
```

Only send relevant context: current skill, related results, available time, preferences, and bounded conversation history. Treat messages and retrieved content as untrusted data.

A suggested task is stored only after the student accepts it and the server validates the task, skill, duration, and plan ownership.

### Failure Handling

- Enforce provider timeouts and per-account request limits.
- Preserve failed-message status and offer retry.
- Validate structured output before using it.
- Keep earlier plans and progress available during failures.
- Label any prepared demo fallback response clearly.

## 🎨 Interface

The design supports Arabic and RTL with purple primary actions, mint goal cards, sky-blue tutoring surfaces, and warm-yellow starting activities.

Main screens: authentication, onboarding, dashboard, assessment/results, learning path, chat/history, progress/marks, career exploration, and profile.

Include loading, empty, error, and success states, readable text, keyboard focus, and labels alongside status colors.

## 🔐 Security Requirements

- Verify access tokens and expected claims on the server.
- Enforce ownership on every protected record and test RLS policies.
- Keep answer keys inaccessible to student clients.
- Reject unauthorized score and message-role changes.
- Validate all write requests on the server.
- Render plain text or sanitized Markdown, not untrusted HTML.
- Keep secrets out of client bundles and logs.
- Use HTTPS and restrict allowed frontend origins.
- Limit message size, request frequency, model output, and provider duration.
- Use fictional data for demonstrations.

Hiding a control in React is not an authorization mechanism.

## 🧪 Testing and Delivery

| Area | Planned checks |
| --- | --- |
| Learning rules | Grading, skill priorities, and time allocation |
| Authentication | Invalid login, expired sessions, and protected requests |
| Authorization | Cross-student access is denied |
| Persistence | Atomic submissions, valid references, and safe retries |
| AI | Timeouts, malformed output, provider failure, and message status |
| React UI | Responsive RTL, keyboard actions, and error states |
| End-to-end | Sign in → assessment → plan → tutor → practice → saved progress |

Deployment is planned for a static React host, a Node-capable Express host, and Supabase. Hosting selection and integrated deployment remain implementation tasks.

## 👥 Team Ownership

Responsibilities are aligned with the team's current experience.

| Member | Primary area | Ownership |
| --- | --- | --- |
| **Member 1 — Basher** | Platform, authentication, conversation backend | Shared setup, Supabase Auth, profiles/grades, security, message APIs, client helpers, and deployment |
| **Member 2 — Ward** | Learning engine and AI service | Questions, grading, assessments, plans/tasks, progress, learning screens, AI adapter/context/prompts, and career content |
| **Member 3 — Yousef** | React chat and career UI | Message components, composer, history, tutor/mentor selection, responsive states, and a simple career page |
| **All members** | Integration and presentation | Reviews, API contracts, complete-flow checks, and demo rehearsal |

### Support and Handoffs

- Yousef starts with mock data and small React components.
- Basher supplies documented `sendMessage()`, `listConversations()`, and `getMessages()` helpers.
- Ward supplies the learning context and task-creation contract.
- Basher supports Yousef's API integration and reviews his changes.
- Ward's AI service is called by Basher's message API, which persists results.
- Ward owns task validation and persistence; Yousef renders the acceptance action.
- Backend, security, database design, AI provider integration, and deployment remain with Basher and Ward.
- Yousef checks React behavior and layout. Basher/Ward own automated backend, grading, and security tests.
- Streaming, voice, and uploads are not blockers for Yousef's work.

## 🌿 Git Workflow

Use **one shared repository** and small feature branches, for example:

```text
feature/auth-profile
feature/conversation-api
feature/assessment-path
feature/ai-service
feature/react-chat-ui
```

These are feature branches, not permanent personal branches.

1. Start from the latest `main`.
2. Complete a small working feature slice.
3. Commit, push, and open a pull request.
4. Ask a teammate to review.
5. Merge after relevant checks pass.
6. Update local `main` and incorporate changes into ongoing branches as needed.
7. Create the next feature branch from updated `main`.

Do not wait for the entire project to finish before merging. Basher or Ward reviews Yousef's changes and provides concrete next steps. Agree on schema and API changes before implementing them.

## 🗺️ Roadmap

- [x] Define the project idea and initial scope.
- [x] Prepare interactive UI prototypes and design documents.
- [x] Agree experience-aligned team responsibilities.
- [ ] Create the shared application skeleton and verified setup scripts.
- [ ] Implement authentication, profiles, and access controls.
- [ ] Implement diagnostics, grading, and plans.
- [ ] Implement persistent chat and live AI integration.
- [ ] Connect React chat and suggested tasks.
- [ ] Complete progress, marks, and career exploration.
- [ ] Run security, integration, and end-to-end checks.
- [ ] Deploy and rehearse the complete presentation.

Update these statuses as implementation progresses.

## 📚 Documentation

The existing full-stack design document and revised team preparation plan were created under the working name **Masari**. The project is now named **Masari**.

Rename/update those documents when adding them to `docs/`, then link their actual repository paths. The latest team allocation above takes precedence over the earlier allocation in the original design document.

---

<p align="center">
  <strong>Masari</strong> · Discover · Plan · Learn · Grow
  <br />
  <em>Your future starts with the next step.</em>
</p>
