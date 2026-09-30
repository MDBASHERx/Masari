const wait = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_PROGRESS = {
  skills: [
    {
      skillId: "equations",
      name: "المعادلات",
      diagnosticPercent: 50,
      practice: {
        correct: 6,
        total: 9,
        percent: 66.67,
        attempts: 3,
        lastPracticedAt: "2026-09-28T12:00:00Z",
      },
    },
    {
      skillId: "fractions",
      name: "الكسور",
      diagnosticPercent: 75,
      practice: {
        correct: 8,
        total: 10,
        percent: 80,
        attempts: 4,
        lastPracticedAt: "2026-09-29T10:30:00Z",
      },
    },
    {
      skillId: "percentages",
      name: "النسب المئوية",
      diagnosticPercent: null,
      practice: {
        correct: 0,
        total: 0,
        percent: null,
        attempts: 0,
        lastPracticedAt: null,
      },
    },
  ],

  latestDiagnostic: {
    attemptId: "mock-diagnostic-1",
    score: 50,
    submittedAt: "2026-09-28T11:00:00Z",
  },

  plan: {
    totalTasks: 4,
    doneTasks: 1,
  },

  recentAttempts: [
    {
      id: "mock-practice-1",
      type: "practice",
      skillId: "equations",
      skillName: "المعادلات",
      score: 100,
      submittedAt: "2026-09-29T10:30:00Z",
    },
    {
      id: "mock-diagnostic-1",
      type: "diagnostic",
      skillId: "equations",
      skillName: "المعادلات",
      score: 50,
      submittedAt: "2026-09-28T11:00:00Z",
    },
  ],
};

export const getProgress = async () => {
  await wait();

  return MOCK_PROGRESS;
};