# Contributing to AgriLink 🌾

Thank you for your interest in contributing to **AgriLink**! We welcome contributions from everyone — whether you're fixing bugs, building new features, improving documentation, or proposing architectural enhancements.

Your contributions help empower smallholder farmers and FPOs with fair market intelligence and direct institutional buyer connectivity. 💚

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the **Fork** button on GitHub and clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/AgriLink.git
cd AgriLink
```

Add upstream remote:

```bash
git remote add upstream https://github.com/Manikantasai1724/AgriLink.git
git remote -v
```

---

### 2. Install Dependencies

Install project dependencies:

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your development credentials:

```env
MONGODB_URI=your_mongodb_connection_string_here
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **IMPORTANT**: Never commit your `.env` file or any credentials to git.

---

### 4. Run the Project

Start the development server:

```bash
npm run dev
```

Open your browser at:

```text
http://localhost:5001
```

---

## 🌿 Branch Naming Convention

Use clear and descriptive branch names:

```text
feature/mandi-price-alert
bugfix/offer-counter-calculation
docs/update-api-reference
refactor/matching-algorithm
test/e2e-trade-lifecycle
```

---

## 💬 Commit Message Format

Follow the conventional commits standard:

```text
[feat] Add dynamic freight calculator for logistics
[fix] Correct net realization formula in market trends
[docs] Update API endpoints and setup instructions
[refactor] Optimize deterministic buyer matching algorithm
```

---

## 🔄 Contribution Workflow

### Step 1: Sync with Upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### Step 2: Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Step 3: Implement & Test Changes

- Write clean, type-safe TypeScript code.
- Ensure components adhere to shadcn/ui and Tailwind CSS design patterns.
- Test your changes locally:
  ```bash
  npm run check
  ```

### Step 4: Commit & Push

```bash
git add .
git commit -m "[feat] Detailed description of change"
git push origin feature/your-feature-name
```

### Step 5: Open a Pull Request

1. Navigate to the repository on GitHub.
2. Click **Compare & pull request**.
3. Fill out the PR description with:
   - What changed and why.
   - How to test the changes.
   - UI screenshots (if applicable).
   - Related issue link (e.g., `Fixes #42`).

---

## 📋 Pull Request Checklist

Before submitting:
- [ ] Code compiles without TypeScript errors (`npm run check`).
- [ ] No extraneous console logs left in production paths.
- [ ] Documentation updated where relevant.
- [ ] No sensitive credentials or `.env` files included.
- [ ] Self-review completed.

---

## 💡 Code Standards

- **Type Safety**: Avoid `any` types; define reusable Zod schemas and TypeScript interfaces in `shared/schema.ts`.
- **Modularity**: Keep components single-purpose and reusable.
- **Accessibility & UX**: Ensure intuitive form validation, accessible color contrast, and proper loading/error states.

---

## 💬 Need Help?

- Open a **GitHub Discussion** for architecture and feature ideas.
- Open a **GitHub Issue** for bug reports and task tracking.

Thank you for helping build AgriLink! 🚀