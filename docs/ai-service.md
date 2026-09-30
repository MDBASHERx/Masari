# AI tutor service

Owner: Ward. Used by the message API (Basher). Lives in `server/src/services/ai/`.

## How to call it

```js
import { buildLearnerContext, generateTutorReply } from "../services/ai/index.js";

// 1. Small learner summary, read with the student's own token (RLS)
const learner = await buildLearnerContext({
    userId: req.user.id,
    accessToken: req.accessToken,
    skillId: conversation.skill_id, // optional
});

// 2. One reply
const result = await generateTutorReply({
    mode: conversation.mode,          // "tutor" | "mentor"
    learner,
    history: previousMessages,        // [{ role: "user" | "assistant", content }], oldest first
    message: body.content,            // the new student message
});

// result = { reply, suggestedTask, isDemo }
// suggestedTask = { title, skillId, minutes } | null
```

Save `result.reply` as the assistant message. If `result.isDemo` is true, show a "demo reply" label in the UI.
If `suggestedTask` is not null, the UI shows "Add to my plan", which calls
`POST /api/plans/:planId/tasks` with the task plus a `requestId`.

## Errors (all are `LearningError` with `code` and `status`)

| status | code | meaning | what to do |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | empty message, over 2000 chars, bad mode | show the message |
| 502 | `AI_PROVIDER_ERROR` | provider failed | mark the message failed, offer retry |
| 502 | `AI_BAD_OUTPUT` | model answer was not valid | mark the message failed, offer retry |
| 504 | `AI_TIMEOUT` | no answer within `AI_TIMEOUT_MS` | mark the message failed, offer retry |

Messages on these errors are safe to show; provider details are never included.
Keep the student's message saved even when the AI fails.

## What the service guarantees

- The system prompt holds trusted content only: our instructions, validated numbers, and skill ids/names from the database
- Untrusted learner fields (the student's goal, task titles) are sent separately as `context`: one `<untrusted_student_context>` JSON block, with `<` and `>` escaped so it cannot be closed early. The system prompt tells the model to treat it as data
- The student's message is sent as user content, never inside the system prompt
- History: last 10 user/assistant messages, each cut to 1000 chars; other roles dropped
- The student's name is never sent to the provider
- A suggested task with an unknown skill or invalid fields is dropped (reply kept); minutes are capped at the student's daily minutes
- The model has no database access: it only returns text

## Provider

`LLM_PROVIDER=gemini` uses the implemented Gemini adapter. Configure `LLM_API_KEY` and `LLM_MODEL` on the server. Production startup rejects the mock provider.

The `mock` adapter remains for deterministic offline tests and evaluation; it is not a production fallback. Its fixed replies are labelled `[رد تجريبي]`.

To extend providers, implement `generate({ system, context, messages, signal }) => Promise<string>` and register the adapter in `providers/index.js`.

- Send `system` as the system prompt
- **Never** add `context` to the system prompt. Use `toChatMessages({ context, messages })`
  (from `generateTutorReply.js`): it attaches `context` as a separate text part of the latest user turn
