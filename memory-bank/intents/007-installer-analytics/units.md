# Units: Installer Analytics with Mixpanel

## Unit Breakdown

| Unit | Description | Priority | Dependencies |
|------|-------------|----------|--------------|
| **analytics-tracker** | Handles all Mixpanel event tracking with machine hash ID | High | None |
| **privacy-documentation** | PRIVACY.md and README analytics section | High | None |

---

## Unit 1: analytics-tracker

### Responsibility

Initialize Mixpanel SDK, generate machine hash ID, detect environment/shell, and send events. Handle multi-IDE selection tracking. Provide simple API for tracking installer events.

### Stories

1. As an installer, I need to initialize Mixpanel with project token
2. As an installer, I need to generate a SHA-256 hash of os.hostname() as distinct_id
3. As an installer, I need to generate a random UUID as session_id
4. As an installer, I need to detect the current shell (zsh, bash, powershell, cmd, fish)
5. As an installer, I need to detect if telemetry is disabled via environment
6. As an installer, I need to send `installer_started` event with full context
7. As an installer, I need to send `ides_confirmed` event with count and list of all IDEs
8. As an installer, I need to send `flow_selected` event when user picks a flow
9. As an installer, I need to send `installation_completed` event for EACH IDE installed
10. As an installer, I need to send `installation_failed` event with error category
11. As an installer, I need all events to be fire-and-forget (non-blocking)
12. As an installer, I need to disable IP storage but enable geolocation

### Key Interfaces

```typescript
interface AnalyticsTracker {
  // Initialize (call once at start, generates machine hash + session ID)
  init(): void;

  // Check if tracking is enabled
  isEnabled(): boolean;

  // Event methods (fire-and-forget)
  trackInstallerStarted(): void;
  trackIdesConfirmed(ides: string[]): void;
  trackFlowSelected(flow: string): void;
  trackInstallationCompleted(ide: string, flow: string, durationMs: number, filesCreated: number): void;
  trackInstallationFailed(ide: string, errorCategory: string, flow?: string): void;
}
```

### Identification Generation

```typescript
import { createHash, randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

// Salt prevents reverse-lookup of hostnames (GDPR compliance)
const HOSTNAME_SALT = 'specsmd-analytics-v1';

/**
 * Generate a stable, anonymous machine ID from hostname.
 * - Deterministic: same machine = same hash
 * - Not reversible: salted hash prevents lookup tables
 * - No persistence: computed at runtime
 * - GDPR compliant: cannot recover hostname from hash
 */
function getMachineId(): string {
  const machineHostname = hostname();
  return createHash('sha256')
    .update(HOSTNAME_SALT + machineHostname)
    .digest('hex');
}

/**
 * Generate a unique session ID for this installer run.
 * - Random UUID: unique per execution
 * - Used to count how many times installer runs on a machine
 */
function getSessionId(): string {
  return randomUUID();
}

```

### Environment Detection

```typescript
// Check if telemetry is disabled
function isTelemetryDisabled(): boolean {
  return (
    process.env.SPECSMD_TELEMETRY_DISABLED === '1' ||
    process.env.DO_NOT_TRACK === '1' ||
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true' ||
    process.env.JENKINS_URL !== undefined ||
    process.env.CIRCLECI === 'true'
  );
}

// Shell detection
function detectShell(): string {
  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec?.toLowerCase() || '';
    if (comspec.includes('powershell') || comspec.includes('pwsh')) return 'powershell';
    if (comspec.includes('cmd')) return 'cmd';
    return 'unknown';
  }
  const shell = process.env.SHELL || '';
  const basename = shell.split('/').pop() || 'unknown';
  return basename; // zsh, bash, fish, sh, etc.
}
```

### Full Implementation

```typescript
import Mixpanel from 'mixpanel';
import { createHash, randomUUID } from 'node:crypto';
import { hostname } from 'node:os';

const MIXPANEL_TOKEN = 'your-project-token';
const HOSTNAME_SALT = 'specsmd-analytics-v1';

class AnalyticsTracker {
  private mixpanel: Mixpanel.Mixpanel | null = null;
  private machineId: string = '';
  private sessionId: string = '';
  private enabled: boolean = false;
  private baseProperties: Record<string, unknown> = {};

  init(): void {
    this.enabled = !isTelemetryDisabled();

    if (!this.enabled) return;

    try {
      this.mixpanel = Mixpanel.init(MIXPANEL_TOKEN);
      this.machineId = getMachineId();   // Salted SHA-256 of hostname - stable, not reversible
      this.sessionId = getSessionId();   // Random UUID - unique per run

      this.baseProperties = {
        distinct_id: this.machineId,
        session_id: this.sessionId,
        $os: process.platform,
        shell: detectShell(),
        node_version: process.version.split('.')[0].replace('v', ''),
        specsmd_version: require('../package.json').version,
      };
    } catch {
      // Silent failure - disable tracking if init fails
      this.enabled = false;
    }
  }

  private track(event: string, properties: Record<string, unknown> = {}): void {
    if (!this.enabled || !this.mixpanel) return;

    // Fire-and-forget - don't await, don't handle errors
    try {
      this.mixpanel.track(event, {
        ...this.baseProperties,
        ...properties,
        // Mixpanel automatically handles geolocation from request IP
        // IP is used for geo lookup then discarded (not stored)
      });
    } catch {
      // Silent failure - never break installation
    }
  }

  trackInstallerStarted(): void {
    this.track('installer_started');
  }

  /**
   * Track confirmation of all IDE selections.
   * Call once after user confirms their selection.
   */
  trackIdesConfirmed(ides: string[]): void {
    this.track('ides_confirmed', {
      ide_count: ides.length,
      ides: ides,
    });
  }

  trackFlowSelected(flow: string): void {
    this.track('flow_selected', { flow });
  }

  /**
   * Track successful installation for a single IDE.
   * Call once per IDE that completes installation.
   */
  trackInstallationCompleted(
    ide: string,
    flow: string,
    durationMs: number,
    filesCreated: number
  ): void {
    this.track('installation_completed', {
      ide,
      flow,
      duration_ms: durationMs,
      files_created: filesCreated,
    });
  }

  /**
   * Track failed installation for a single IDE.
   */
  trackInstallationFailed(
    ide: string,
    errorCategory: string,
    flow?: string
  ): void {
    this.track('installation_failed', {
      ide,
      error_category: errorCategory,
      ...(flow && { flow }),
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton export
export const analytics = new AnalyticsTracker();
```

### Base Properties (included in every event)

```typescript
interface BaseProperties {
  distinct_id: string;       // Salted SHA-256 hash of os.hostname() - stable across runs
  session_id: string;        // Random UUID - unique per installer run
  $os: string;               // process.platform (darwin, linux, win32)
  shell: string;             // detectShell() (zsh, bash, powershell, cmd, fish)
  node_version: string;      // process.version major (e.g., '20')
  specsmd_version: string;   // From package.json (e.g., '0.4.0')
}
```

### Usage in Installer (Multi-IDE Example)

```typescript
import { analytics } from './analytics';

async function install() {
  const startTime = Date.now();

  // Initialize analytics (generates machine hash)
  analytics.init();
  analytics.trackInstallerStarted();

  // User selects multiple IDEs and confirms
  const selectedIdes = await promptIdeSelection(); // Returns ['claude-code', 'cursor', 'windsurf']

  // Track the confirmed selection with count and list
  analytics.trackIdesConfirmed(selectedIdes);

  // User selects flow
  const flow = await promptFlowSelection();
  analytics.trackFlowSelected(flow);

  // Install for each IDE
  for (const ide of selectedIdes) {
    const ideStartTime = Date.now();

    try {
      const filesCreated = await performInstallation(ide, flow);
      const durationMs = Date.now() - ideStartTime;

      analytics.trackInstallationCompleted(ide, flow, durationMs, filesCreated);
    } catch (error) {
      analytics.trackInstallationFailed(
        ide,
        categorizeError(error),
        flow
      );
      // Continue with other IDEs or throw based on your error handling
    }
  }
}
```

### Acceptance Criteria

- Mixpanel SDK initialized with correct token
- Machine ID is SHA-256 hash of hostname (same across sessions)
- Shell correctly detected on all platforms
- Telemetry disabled when env vars set
- Events sent without blocking installation
- All events include base properties
- IP not stored but geolocation works
- No files written to disk
- Silent failures (never break installation)
- Multi-IDE selection tracked correctly (N events for N IDEs)
- Per-IDE install completion tracked

---

## File Structure

```text
/
├── PRIVACY.md             # Privacy policy and data collection disclosure
├── README.md              # Updated with analytics section linking to PRIVACY.md
└── src/
    └── analytics/
        ├── index.ts           # Exports analytics singleton
        ├── tracker.ts         # AnalyticsTracker class
        ├── machine-id.ts      # getMachineId() - SHA-256 of hostname
        └── env-detector.ts    # Shell and CI detection utilities
```

---

## Unit 2: privacy-documentation

### Responsibility

Create and maintain privacy documentation that discloses data collection practices and provides opt-out instructions.

### Stories

1. As a user, I need to understand what data specsmd collects
2. As a user, I need to know how to disable telemetry
3. As a user, I need assurance that no personal information is stored

### Deliverables

#### PRIVACY.md (root of repository)

```markdown
# Privacy Policy

## Analytics

specsmd collects anonymous usage analytics to improve the product. This data helps us understand which IDEs and flows are most popular, and identify issues.

### What We Collect

| Data | Purpose |
|------|---------|
| Machine ID | Pseudonymized hash to count unique installations |
| Session ID | Random ID to count installer runs |
| Operating System | darwin, linux, or win32 |
| Shell Type | zsh, bash, powershell, cmd, fish |
| Node.js Version | Major version (e.g., "20") |
| specsmd Version | Package version |
| Selected IDEs | Which IDEs were chosen |
| Selected Flow | Which flow was installed |
| Country/City | Approximate location from IP (IP not stored) |

### What We Do NOT Collect

- No personal information (names, emails, usernames)
- No file paths or folder names
- No project contents or code
- No IP addresses (used for geolocation only, then discarded)

### How to Opt Out

Disable telemetry using any of these methods:

```bash
# Environment variable
SPECSMD_TELEMETRY_DISABLED=1 npx specsmd@latest install

# Standard Do Not Track
DO_NOT_TRACK=1 npx specsmd@latest install

# Command line flag
npx specsmd@latest install --no-telemetry
```

Telemetry is automatically disabled in CI environments.

### Legal Basis

We collect this data under "legitimate interest" (GDPR Article 6(1)(f)) for product improvement. No consent is required as we collect no personal information.

### Data Processor

Analytics are processed by [Mixpanel](https://mixpanel.com/legal/privacy-policy/).
```

#### README.md Update

Add section at the **bottom** of README.md (before any existing footer/license section):

```markdown
## Analytics

specsmd collects anonymous usage analytics to improve the product. No personal information is collected.

To disable: `SPECSMD_TELEMETRY_DISABLED=1 npx specsmd@latest install`

See [PRIVACY.md](./PRIVACY.md) for details.
```

### Acceptance Criteria

- PRIVACY.md exists at repository root
- PRIVACY.md lists all collected data points
- PRIVACY.md explains opt-out methods
- PRIVACY.md states legal basis
- README.md references PRIVACY.md
- README.md shows quick opt-out command

---

## Mixpanel Dashboard Setup

Once events are flowing, create these in Mixpanel:

### Insights

1. **Unique Machines** - Unique count of `distinct_id`
2. **Total Sessions** - Unique count of `session_id`
3. **Sessions per Machine** - Count of `session_id` grouped by `distinct_id`
4. **Repeat Users** - Machines with 2+ unique `session_id` values
5. **IDE Popularity** - Count occurrences in `ides` array from `ides_confirmed`
6. **Per-IDE Installs** - Count of `installation_completed` grouped by `ide`
7. **Multi-IDE Sessions** - Count of `ides_confirmed` where `ide_count > 1`
8. **Average IDEs Selected** - Average of `ide_count` from `ides_confirmed`
9. **Flow Breakdown** - `flow_selected` grouped by `flow`
10. **OS Distribution** - Any event grouped by `$os`
11. **Shell Distribution** - `installer_started` grouped by `shell`
12. **Geographic Map** - Any event by country/city

### Funnels

1. **Installation Funnel**
   - Step 1: `installer_started`
   - Step 2: `ides_confirmed`
   - Step 3: `flow_selected`
   - Step 4: `installation_completed`

### Cohorts

1. **Power Users** - Users with 3+ `installer_started` events
2. **Multi-IDE Users** - Users who selected 2+ IDEs in any session

### Key Metrics

- **Completion Rate per IDE**: `installation_completed` / `ide_selected` grouped by `ide`
- **Multi-IDE Rate**: % of sessions where `ide_count > 1`
- **Repeat Install Rate**: Users with 2+ sessions / Total users
