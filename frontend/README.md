# Legal AI Framework: frontend

Next.js 16 web app for the Legal AI Framework. Each department gets its own isolated AI workspace. Access is controlled by role (RBAC) and department (tenant). AI runs through **AWS Bedrock**.

## Screens

| Route | Who | What |
|---|---|---|
| `/login` | everyone | Sign in (demo mode: pick a sample user) |
| `/w/<dept>` | members of that department | AI assistant, approved models, documents, access panel |
| `/w/<dept>/users` | that department's admin | Invite and remove people, set roles |
| `/admin` | platform admin | Departments, approved Bedrock models per department, audit log |
| `/denied` | anyone blocked | Explains why access was refused (and logs it) |
| `/docs/<id>` | the document's department | Document page, tenant-checked |

## How access is enforced

1. **`proxy.ts`** runs before every request. It verifies the signed session cookie and blocks `/w/<other-dept>` and `/admin`.
2. **Every page, server action and API route checks again** (`lib/auth.ts`). Nothing relies on the proxy alone.
3. **`/api/chat` takes the department from the signed session, never from the request**, rejects models that aren't approved for that department, and runs guardrails (payment card numbers, Irish PPS numbers) before anything reaches Bedrock.
4. **Platform admins manage tenants but cannot open department documents or chats.**
5. **The audit log records who used which model and every denial. It never stores prompt text.**

The rules live in `lib/access.ts` and `lib/guardrails.ts`, with unit tests in `tests/`.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local     # demo mode, no AWS needed
npm run dev                    # http://localhost:3000
```

Sign in as **Aisha Murphy** (Finance member) and try:
- asking the assistant something
- including `4111 1111 1111 1111` in a prompt, which the guardrail blocks
- **Try opening an HR document**, which is denied and logged

Then sign in as **Platform admin** to see the audit log and switch models on or off.

```bash
npm test          # access rules + guardrails (node:test)
npm run lint      # TypeScript type check
npm run build     # production build
```

## Real AI answers (AWS Bedrock)

```bash
# .env.local
BEDROCK_ENABLED=true
AWS_REGION=eu-west-1
BEDROCK_MODEL_CLAUDE=<model or inference-profile ID enabled in your account>
```

Credentials come from the standard AWS chain: your local AWS profile, or the ECS task role in AWS. The role needs `bedrock:InvokeModel` on the model ARNs you allow. Check model IDs and regions in the Bedrock console; some models need an inference profile ID (for example `eu.anthropic...`).

## Docker

```bash
docker build -t legal-ai-frontend .
docker run -p 3000:3000 -e SESSION_SECRET="$(openssl rand -base64 32)" legal-ai-frontend
```

Multi-stage build: it runs tests, then uses Next.js standalone output and runs as a non-root user with a `/api/health` healthcheck. In production `SESSION_SECRET` is required, and cookies are `Secure`, so serve over HTTPS. For a plain-HTTP local test, add `-e INSECURE_COOKIES=true`.

## CI/CD (AWS only)

`../buildspec.yml` is for **AWS CodeBuild**, run from **AWS CodePipeline**. It installs, tests, type-checks, builds the image, pushes it to **ECR**, and writes `imagedefinitions.json` for the ECS deploy stage.

## What's a prototype (next steps)

| Today | Production |
|---|---|
| Demo user picker | Company IdP via **Amazon Cognito** (OIDC callback sets the same session cookie) |
| In-memory store (`lib/store.ts`), which resets on restart | **DynamoDB**, partitioned by tenant ID |
| Sample documents list | **S3** bucket prefix per department + **Bedrock Knowledge Base** per department |
| App-level guardrails | Plus **Amazon Bedrock Guardrails** |
| App-level model approvals | Plus an **IAM policy per department role** limiting `bedrock:InvokeModel` |
| `[USED] of [BUDGET]` placeholder | Real Bedrock usage per department from CloudWatch |
