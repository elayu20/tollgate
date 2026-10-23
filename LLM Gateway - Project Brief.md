# LLM API Gateway: Project Brief

This is a handoff document. Read the whole thing before starting. It explains who I am, what we're building, why, and how I want you to help me.

## Who I am

- I'm Edward, a 2nd-3rd year Computing Science student at Simon Fraser University (SFU), applying to software engineering internships and co-ops.
- I want a new resume project that I can finish in **about 2 days**. It should fill tool gaps on my resume and give me strong talking points for technical interviews.
- I've gotten interviews before but didn't pass them, so being able to **explain and defend** this project matters as much as building it.

### What I already have on my resume

1. **PC Price Estimator**: Next.js, React, TypeScript, PostgreSQL, Prisma. It has a 39k-record ETL pipeline, the eBay API with OAuth 2.0 and Next.js API routes.
2. **SpaceBreak**: a team Java game built with LibGDX, Maven, JUnit, Mockito and JaCoCo. Agile/Scrum, 5-person team.
3. **Multithreaded chat server + fuzzing client**: C, POSIX sockets, pthreads and CMake.
4. **Custom PC business**: built and sold 40+ PCs.

### Skills I actually have

C++, C, Java, JavaScript, TypeScript, HTML/CSS, SQL, OOP, data structures and algorithms, multithreading, TCP/IP, Git/GitHub, GDB, CMake, Maven, Linux (WSL), React, Next.js, PostgreSQL, Prisma, JUnit, Mockito, basic Bash.

My Python is LeetCode-level only. Don't assume I can write Python scripts or tooling.

### Gaps this project is meant to fill

Docker, Docker Compose, Redis/caching, CI/CD (GitHub Actions), cloud deployment, a standalone backend service (not just Next.js route handlers), observability (Prometheus/Grafana), load testing (k6) and LLM API integration.

## The project in plain terms

It's a self-hosted **middleman server between apps and LLM APIs** like Claude or OpenAI. Apps send their AI requests to my gateway instead of calling the provider directly. The gateway forwards each request and returns the answer, and it adds rules along the way.

Analogy: it works like a front desk in an office building. It checks your badge (API key), stops you from showing up 50 times an hour (rate limiting), answers common questions itself (caching) and logs every visit (usage tracking).

Real products that do this: Cloudflare AI Gateway, Portkey, LiteLLM. I'm building a smaller version.

### Example use cases

- A support chatbot gets the same question 1,000 times, and caching means you pay for the answer once.
- A school or company gives each person a key with a daily limit, so no one burns the whole budget.
- If OpenAI goes down, requests automatically fall back to Claude.
- "Why is our AI bill $8k?" gets answered with one query on the usage table, broken down by app.

## Features

| Feature | What it does |
|---|---|
| API keys | Each client app gets its own key, stored in Postgres |
| Rate limiting | Token bucket per key, stored in Redis. Over the limit returns `429` with a `Retry-After` header |
| Caching | Identical requests are served from Redis, with a TTL. Track the cache hit rate |
| Retries + fallback | Exponential backoff on failure, then fall back to a second provider |
| Streaming | Pass Server-Sent Events (SSE) through so answers appear word by word |
| Usage tracking | Log tokens and estimated cost per key in Postgres |
| Metrics | Prometheus `/metrics` endpoint plus a Grafana dashboard (p50/p95 latency, requests/sec, cache hit rate, 429 count) |
| Load test | k6 script that produces real performance numbers for my resume |
| Mock provider | A fake LLM provider that returns canned responses instantly. Use it for development and load testing so I don't spend money on real API calls |
| Infra | Docker Compose brings up the gateway, Postgres, Redis, Prometheus and Grafana with one command. GitHub Actions runs lint, tests and the Docker build. Deploy to Fly.io or AWS if time allows |

## Decisions already made

- **Language: TypeScript (Node.js) with Fastify.** I already know TypeScript. We considered Go but rejected it because learning new syntax plus all the new tools would blow the 2-day timeline.
- **Postgres** for keys and usage. Use Prisma, since I already know it.
- **Redis** for rate limiting and caching.
- **Use the mock provider by default.** Only use real APIs for a short demo.

## How I want to work (important)

- I'm **not** blindly vibecoding. I'll read the code and type the important parts myself. I want to **understand the concepts, not every line**, and finish as fast as possible.
- **Boilerplate is fine to just generate and copy-paste**: project setup, Dockerfile, docker-compose, CI config, schema, Grafana/Prometheus config, type definitions.
- **I'll type and properly understand these 4 core pieces**, so explain them clearly and keep them short:
  1. The rate limiter (token bucket in Redis), about 30 lines
  2. The cache check, about 20 lines
  3. Retry with backoff plus provider fallback, about 30 lines
  4. The streaming passthrough, about 30 lines
- Explain things in simple, normal human terms. Don't over-explain the boilerplate.
- Never hand me fake metrics. Resume numbers must come from the load tests I actually run.

## Timeline (about 15 hours over 2 days)

| Block | Time | Result |
|---|---|---|
| Setup + basic proxy | ~2 hrs | Request in, Claude/mock answer out |
| API keys + Postgres | ~1.5 hrs | Per-app keys, usage logged |
| Redis rate limiter + cache | ~2.5 hrs | Core concepts #1 and #2 |
| Retries + fallback | ~1.5 hrs | Core concept #3 |
| Streaming | ~1.5 hrs | Core concept #4 |
| Docker Compose | ~1 hr | One-command startup |
| Metrics + Grafana | ~2 hrs | Live dashboard and a screenshot |
| k6 load test | ~1 hr | Real resume numbers |
| GitHub Actions + README | ~1.5 hrs | CI badge, architecture diagram, dashboard screenshot |

**If I only have 1 day:** cut streaming and fallback. Keep the rate limiting, caching, Docker, dashboard and load test. **Never cut the load test**, because that's where the resume numbers come from.

## Interview questions I need to be able to answer when done

1. How does a token bucket work, and why store it in Redis instead of in-memory?
2. When does a cached answer become stale or wrong, and how did you pick the TTL?
3. Why use exponential backoff instead of retrying immediately?
4. What is Docker Compose actually doing when you run it?
5. What did your load test measure, and what was the bottleneck?

Bonus ones to prep: token bucket vs sliding window, and what happens when two identical uncached requests arrive at the same time (cache stampede).

## Target resume bullet (fill in real numbers only)

> Built an LLM API gateway in TypeScript with Redis-backed token-bucket rate limiting and response caching, cutting p95 latency on repeated prompts by **X%** under a **k6 load test of N req/s**. Containerized with Docker Compose, with CI via GitHub Actions and Prometheus/Grafana monitoring.

## First step for you

Set up the project skeleton (folders, `package.json`, Fastify server, Docker Compose with Postgres and Redis, the Prisma schema and the mock provider). Then walk me through the basic proxy. After that, go one core piece at a time.