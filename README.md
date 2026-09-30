<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Cairo&size=28&pause=1000&color=7950D6&center=true&vCenter=true&width=900&lines=Masari+%7C+مساري;Your+Learning+Journey+Starts+Here;AI+Tutor+%7C+Study+Mentor;Learn+%7C+Practice+%7C+Explore+%7C+Grow" alt="Masari — AI Learning and Career Exploration" />
</p>

<p align="center">
  <strong>مساري — مرشدك المهني لمسارك الصحيح</strong>
</p>

<p align="center">
  An Arabic-first learning platform that helps students understand their skills,
  follow personalized learning plans, and explore future career paths.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project-Hackathon-7950D6?style=for-the-badge" alt="Hackathon Project" />
  <img src="https://img.shields.io/badge/Status-In%20Development-F59E0B?style=for-the-badge" alt="In Development" />
  <img src="https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
</p>

---

# 📖 About

**Masari — مساري** brings learning, study guidance, and career exploration into one place.

Students can assess their current skills, practice areas that need attention,
track their progress, and talk to an AI assistant for explanations and guidance.

The platform provides two conversation modes:

- **AI Tutor** — Explains mathematics, offers hints, and reviews solutions.
- **Study Mentor** — Helps organize study time and explore interests and career options.

Career suggestions are opportunities to explore, not decisions about a student's future.

---

# ✨ Features

- Account registration and login
- Student profiles with grade level, goals, and daily study time
- Diagnostic mathematics assessments
- Personalized learning plans
- Practice tasks and progress tracking
- AI Tutor and Study Mentor conversations
- Saved conversation history
- Suggested tasks that students can add to their plans
- School grade recording and editing
- Career exploration with practical activities
- Arabic interface with right-to-left layout
- Responsive design for desktop and mobile
- Soft colors and animated backgrounds with reduced-motion support

---

# 🛠️ Technologies

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

| Layer | Technology |
| --- | --- |
| Frontend | React + JavaScript |
| Routing | React Router |
| Styling | CSS |
| Build tool | Vite |
| HTTP client | Axios |
| Backend | Node.js + Express |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| AI provider | Google Gemini |
| Request validation | Zod |
| Automated testing | Vitest |
| Code quality | ESLint |

---

# 🧠 Learning Experience

1. **Create an account** and complete your student profile.
2. **Take an assessment** to identify strengths and areas to practice.
3. **Get a learning plan** based on your results and available study time.
4. **Practice skills** through focused tasks.
5. **Ask the AI Tutor** for explanations, hints, and feedback.
6. **Talk to the Study Mentor** about study habits and future interests.
7. **Track progress** and record school grades.

---

# 🎯 Current Scope

The initial learning content focuses on:

- Fractions
- Equations
- Percentages

Career exploration currently includes:

- Engineering
- Computer Science

Student profiles support grades **1–12**, while the current question bank
focuses on secondary-school mathematics.

Full curriculum coverage, official assessments, and school administration
dashboards are outside the current scope.

---

# 📂 Project Structure

    Masari/
    ├── client/              # React frontend
    │   ├── src/
    │   │   ├── components/
    │   │   ├── context/
    │   │   ├── hooks/
    │   │   ├── locales/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   └── styles/
    │   └── .env.example
    ├── server/              # Express backend
    │   ├── src/
    │   │   ├── controllers/
    │   │   ├── routes/
    │   │   ├── services/
    │   │   └── validators/
    │   ├── scripts/
    │   ├── tests/
    │   └── .env.example
    ├── supabase/            # Database configuration and migrations
    ├── docs/                # Evaluation and deployment documentation
    ├── package.json
    └── README.md

---

# 🚀 Getting Started

### Prerequisites

- Node.js compatible with the project dependencies
- npm
- A Supabase project
- A Gemini API key for real AI responses

### 1. Install dependencies

Run from the project root:

    npm ci
    npm ci --prefix client
    npm ci --prefix server

### 2. Configure environment variables

Create your local environment files using:

    client/.env.example → client/.env
    server/.env.example → server/.env

Configure the API URL, Supabase settings, and AI provider settings
using the example files as the reference.

Server secrets must remain in `server/.env`.
Variables prefixed with `VITE_` are public frontend configuration.

### 3. Prepare the database

Link the Supabase project, review migration history, and apply any pending
migrations using the team's database setup process.

See [deployment instructions](docs/deployment.md) for details.

### 4. Start development

    npm run dev

| Service | Local URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API health check | http://localhost:5000/api/health |

---

# 🧪 Quality Checks

Run frontend linting:

    npm run lint --prefix client

Run backend tests:

    npm test --prefix server

Build the frontend:

    npm run build --prefix client

Database concurrency tests require an isolated test database.
A successful build does not replace testing the deployed application.

---

# 🔐 Security and Reliability

- Authentication through Supabase Auth
- Server-side request validation
- Ownership checks for student data
- PostgreSQL Row Level Security
- Server-only AI and privileged database credentials
- Chat rate limiting and AI concurrency limits
- Request identifiers to prevent duplicate writes
- Retry handling for interrupted chat requests

---

# 👥 Team

| Member | Main contribution |
| --- | --- |
| **Basher** | Project integration, authentication, student profiles, chat integration, grades, and release preparation |
| **Ward** | Learning engine, assessments, plans, practice, progress APIs, and AI service foundation |
| **Yousef** | React interfaces and frontend integration |

All team members contribute to testing, reviewing, and presenting the project.

---

# 📚 Purpose

Masari was built to demonstrate how AI can support students through
clear explanations, manageable learning steps, and thoughtful career exploration.

The goal is to help students become more confident learners
and make informed choices about their next steps.

---

# 🌍 Deployment

The application uses a static React frontend and a separate Express API.

Production deployment requires HTTPS URLs, server environment configuration,
Supabase Auth settings, and final acceptance testing.

- [Deployment guide](docs/deployment.md)
- [Release readiness report](docs/release-readiness.md)

---

<p align="center">
  <strong>مساري — كل خطوة، أقرب لمستقبلك</strong>
  <br />
  Learn · Practice · Explore · Grow
</p>