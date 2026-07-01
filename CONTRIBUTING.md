# Contributing to LinkedIn Message Drafter

Thank you for your interest in contributing! This project is open-source and we welcome contributions from everyone.

## Getting Started

### 1. Fork & Clone

```bash
# Fork this repo on GitHub, then:
git clone https://github.com/<your-username>/Linkedin-Messaging.git
cd Linkedin-Messaging
```

### 2. Load the Extension in Chrome

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (toggle in the top-right).
3. Click **Load unpacked** and select the cloned project folder.
4. The extension icon will appear in your toolbar — pin it for easy access.

### 3. Make Changes

- Edit the source files directly — no build step is required.
- After saving changes, go to `chrome://extensions` and click the **reload** button (↻) on the extension card to pick up your changes.
- If you modify `manifest.json`, you may need to remove and re-load the extension.

## Project Structure

| Directory | What lives there |
|---|---|
| `popup/` | Main UI — profile review, option selectors, draft output |
| `content/` | Content script that scrapes LinkedIn profile data |
| `background/` | Service worker — handles Claude API calls |
| `options/` | Settings page — API key, model selection, sender details |
| `lib/` | Shared utilities, templates, and storage helpers |
| `icons/` | Extension icons (16, 32, 48, 128 px) |
| `store/` | Chrome Web Store listing assets (not part of the extension) |

## Code Style

- **Plain JavaScript** — no frameworks, no build tools, no transpilation.
- Use `const` / `let` (never `var`).
- Prefer `async`/`await` over raw promises.
- Use meaningful variable names and add comments for non-obvious logic.
- Keep functions small and focused.

## Submitting a Pull Request

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** and test them in Chrome.
3. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add support for InMail drafting"
   ```
   Use prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`
4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** on GitHub against `main`.

### PR Checklist

- [ ] Extension loads without errors in `chrome://extensions`
- [ ] Tested on at least one LinkedIn profile
- [ ] No `console.error` messages in DevTools
- [ ] Updated README if you added a user-facing feature
- [ ] Didn't break existing template or AI drafting functionality

## Reporting Issues

Open a [GitHub Issue](https://github.com/bhavikprit/Linkedin-Messaging/issues) with:

- **Steps to reproduce** the problem
- **Expected behavior** vs. **actual behavior**
- **Chrome version** and **OS**
- **Console errors** (right-click extension popup → Inspect → Console)
- A screenshot if it's a UI issue

## Feature Requests

We love ideas! Open an issue with the `enhancement` label and describe:

- What problem does it solve?
- How should it work from the user's perspective?
- Any technical considerations?

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold a welcoming, inclusive environment for everyone.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Questions? Reach out at **bhavikpatel13792@gmail.com** or open an issue. 🙏
