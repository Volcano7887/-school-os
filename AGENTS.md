<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Breaking changes found so far (this project's Next.js version)

- **`middleware.ts` is renamed to `proxy.ts`**, exporting a function named `proxy` (not `middleware`). It lives at `src/proxy.ts` (same level as `src/app`, since this project uses `--src-dir`). See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. A `middleware.ts` file at the project root is silently ignored — no error, no warning, it just never runs, which is easy to miss.

<!-- anchor:ai-instructions:start -->
## Anchor progress tracking

This project has a file called `ANCHOR.md` in its root that the Anchor desktop app reads automatically to track progress. Update it whenever you finish meaningful work, or when asked to "update progress" or "summarize":

```
---
progress: <0-100, your honest estimate of completion toward the goal>
status: <Not Started | In Progress | Blocked | Paused | Completed>
next: <the single most important next task>
goal: <what "done" looks like for this project>
---

<freeform notes: what was just done, what's open, anything worth remembering next session>
```

Base `progress` on real completion toward the goal, not file/commit count. Overwrite the body each time rather than appending to it.
<!-- anchor:ai-instructions:end -->
