# Privacy

## Analytics

specsmd collects anonymous usage analytics **only during installation** to improve the product. No personal information is collected.

### What We Collect

- Operating system (macOS, Linux, Windows)
- Shell type (zsh, bash, powershell, etc.)
- Selected IDEs and flow
- Installation success/failure
- Approximate location (country/city from IP, IP is not stored)
- Node.js version
- specsmd version

### What We Don't Collect

- No usernames or personal identifiers
- No file paths or folder names
- No project contents
- No IP addresses (used only for geolocation, then discarded)

### Opt-Out

To disable analytics:

```bash
SPECSMD_TELEMETRY_DISABLED=1 npx specsmd@latest install
```

Or use the standard `DO_NOT_TRACK` environment variable:

```bash
DO_NOT_TRACK=1 npx specsmd@latest install
```

Analytics are automatically disabled in CI environments.
