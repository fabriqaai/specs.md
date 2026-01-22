/**
 * FIRE Parser Module
 *
 * Parses FIRE flow artifacts from the .specs-fire directory.
 * Reads state.yaml and scans filesystem for intents, work items, runs, and standards.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { FlowParser, ArtifactParseResult } from '../../../core/types';
import {
    FireArtifacts,
    FireIntent,
    FireWorkItem,
    FireRun,
    FireStandard,
    FireState,
    FireProject,
    FireWorkspace,
    FireStatus,
    ExecutionMode,
    RunScope,
    RunWorkItem,
    Complexity
} from '../types';

// Re-export types
export * from '../types';

/**
 * FIRE-specific FlowParser implementation.
 *
 * Parses the .specs-fire directory structure including:
 * - state.yaml (central state)
 * - intents/{intent-id}/brief.md
 * - intents/{intent-id}/work-items/{work-item-id}.md
 * - runs/run-{NNN}/ folders
 * - standards/*.md files
 */
export class FireParser implements FlowParser<FireArtifacts> {
    /**
     * Scan and parse all artifacts from the .specs-fire folder.
     * @param rootPath - Path to the .specs-fire folder
     */
    async scanArtifacts(rootPath: string): Promise<FireArtifacts> {
        const workspacePath = path.dirname(rootPath);

        // Check if valid FIRE project
        const statePath = path.join(rootPath, 'state.yaml');
        if (!fs.existsSync(statePath)) {
            return this._createEmptyArtifacts(rootPath, workspacePath);
        }

        try {
            // Parse state.yaml (uses snake_case keys)
            const stateContent = fs.readFileSync(statePath, 'utf8');
            const rawState = yaml.parse(stateContent) as RawFireState | null;

            if (!rawState) {
                return this._createEmptyArtifacts(rootPath, workspacePath);
            }

            // Convert snake_case to camelCase
            const state = this._normalizeState(rawState);

            // Parse project info
            const project = this._parseProject(state);
            const workspace = this._parseWorkspace(state);

            // Scan filesystem for detailed artifacts
            const intents = await this._scanIntents(rootPath, state);
            const runs = await this._scanRuns(rootPath, state);
            const standards = await this._scanStandards(rootPath);

            // Determine active run
            const activeRun = state.activeRun
                ? runs.find(r => r.id === state.activeRun?.id) || null
                : null;

            return {
                isProject: true,
                rootPath,
                workspacePath,
                version: project?.fireVersion || '0.0.0',
                project,
                workspace,
                intents,
                runs,
                activeRun,
                standards
            };
        } catch (error) {
            console.error('Error parsing FIRE artifacts:', error);
            return this._createEmptyArtifacts(rootPath, workspacePath);
        }
    }

    /**
     * Get glob patterns to watch for changes.
     */
    watchPatterns(): string[] {
        return [
            'state.yaml',
            'intents/**/*.md',
            'runs/**/*.md',
            'standards/**/*.md'
        ];
    }

    /**
     * Parse a single artifact file.
     */
    async parseArtifact(filePath: string): Promise<ArtifactParseResult | null> {
        const normalizedPath = filePath.replace(/\\/g, '/');

        if (normalizedPath.endsWith('state.yaml')) {
            return {
                type: 'state',
                data: null,
                path: filePath
            };
        }

        if (normalizedPath.includes('/intents/')) {
            if (normalizedPath.includes('/work-items/')) {
                return {
                    type: 'work-item',
                    data: null,
                    path: filePath
                };
            }
            if (normalizedPath.endsWith('brief.md')) {
                return {
                    type: 'intent',
                    data: null,
                    path: filePath
                };
            }
        }

        if (normalizedPath.includes('/runs/')) {
            return {
                type: 'run',
                data: null,
                path: filePath
            };
        }

        if (normalizedPath.includes('/standards/')) {
            return {
                type: 'standard',
                data: null,
                path: filePath
            };
        }

        return null;
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Create empty artifacts structure.
     */
    private _createEmptyArtifacts(rootPath: string, workspacePath: string): FireArtifacts {
        return {
            isProject: false,
            rootPath,
            workspacePath,
            version: '0.0.0',
            project: null,
            workspace: null,
            intents: [],
            runs: [],
            activeRun: null,
            standards: []
        };
    }

    /**
     * Parse project info from state.
     */
    private _parseProject(state: FireState): FireProject | null {
        if (!state.project) return null;

        return {
            name: state.project.name || 'Unknown',
            description: state.project.description,
            created: state.project.created || new Date().toISOString(),
            fireVersion: state.project.fireVersion || '0.0.0'
        };
    }

    /**
     * Parse workspace settings from state.
     */
    private _parseWorkspace(state: FireState): FireWorkspace | null {
        if (!state.workspace) return null;

        return {
            type: state.workspace.type || 'greenfield',
            structure: state.workspace.structure || 'monolith',
            autonomyBias: state.workspace.autonomyBias || 'balanced',
            runScopePreference: state.workspace.runScopePreference || 'single',
            scannedAt: state.workspace.scannedAt,
            parts: state.workspace.parts
        };
    }

    /**
     * Scan intents directory.
     */
    private async _scanIntents(rootPath: string, state: FireState): Promise<FireIntent[]> {
        const intentsPath = path.join(rootPath, 'intents');
        if (!fs.existsSync(intentsPath)) return [];

        const intents: FireIntent[] = [];
        const stateIntents = state.intents || [];

        try {
            const intentDirs = fs.readdirSync(intentsPath, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);

            for (const intentId of intentDirs) {
                const intentPath = path.join(intentsPath, intentId);
                const briefPath = path.join(intentPath, 'brief.md');

                // Get state info for this intent
                const stateIntent = stateIntents.find(i => i.id === intentId);

                // Parse brief.md if exists
                let title = intentId;
                let description: string | undefined;
                let createdAt: string | undefined;

                if (fs.existsSync(briefPath)) {
                    const briefContent = fs.readFileSync(briefPath, 'utf8');
                    const parsed = this._parseFrontmatter(briefContent);
                    title = (parsed.title as string) || intentId;
                    description = parsed.description as string | undefined;
                    createdAt = parsed.created as string | undefined;
                }

                // Scan work items
                const workItems = await this._scanWorkItems(intentPath, intentId, stateIntent?.workItems || []);

                // Determine intent status from work items and state
                const status = this._determineIntentStatus(stateIntent?.status, workItems);

                intents.push({
                    id: intentId,
                    title,
                    status,
                    filePath: briefPath,
                    description,
                    workItems,
                    createdAt
                });
            }
        } catch (error) {
            console.error('Error scanning intents:', error);
        }

        return intents;
    }

    /**
     * Scan work items for an intent.
     */
    private async _scanWorkItems(
        intentPath: string,
        intentId: string,
        stateWorkItems: Array<{ id: string; status?: FireStatus; mode?: ExecutionMode }>
    ): Promise<FireWorkItem[]> {
        const workItemsPath = path.join(intentPath, 'work-items');
        if (!fs.existsSync(workItemsPath)) return [];

        const workItems: FireWorkItem[] = [];

        try {
            const files = fs.readdirSync(workItemsPath)
                .filter(f => f.endsWith('.md'));

            for (const file of files) {
                const workItemId = file.replace('.md', '');
                const filePath = path.join(workItemsPath, file);

                // Get state info
                const stateItem = stateWorkItems.find(w => w.id === workItemId);

                // Parse work item frontmatter
                const content = fs.readFileSync(filePath, 'utf8');
                const parsed = this._parseFrontmatter(content);

                // Support both 'depends_on' and 'dependencies' field names
                const deps = (parsed.depends_on || parsed.dependencies) as string[] | undefined;

                workItems.push({
                    id: workItemId,
                    intentId,
                    title: (parsed.title as string) || workItemId,
                    status: stateItem?.status || this._normalizeStatus(parsed.status) || 'pending',
                    mode: stateItem?.mode || this._normalizeMode(parsed.mode) || 'confirm',
                    complexity: this._normalizeComplexity(parsed.complexity) || 'medium',
                    filePath,
                    description: parsed.description as string | undefined,
                    dependencies: deps,
                    createdAt: parsed.created as string | undefined
                });
            }
        } catch (error) {
            console.error('Error scanning work items:', error);
        }

        return workItems;
    }

    /**
     * Scan runs directory.
     */
    private async _scanRuns(rootPath: string, state: FireState): Promise<FireRun[]> {
        const runsPath = path.join(rootPath, 'runs');
        if (!fs.existsSync(runsPath)) return [];

        const runs: FireRun[] = [];

        try {
            const runDirs = fs.readdirSync(runsPath, { withFileTypes: true })
                .filter(d => d.isDirectory() && d.name.startsWith('run-'))
                .map(d => d.name)
                .sort();

            for (const runId of runDirs) {
                const runPath = path.join(runsPath, runId);
                const runLogPath = path.join(runPath, 'run.md');

                // Check what files exist in run folder
                const hasPlan = fs.existsSync(path.join(runPath, 'plan.md'));
                const hasWalkthrough = fs.existsSync(path.join(runPath, 'walkthrough.md'));
                const hasTestReport = fs.existsSync(path.join(runPath, 'test-report.md'));

                // Parse run.md for metadata
                let scope: RunScope = 'single';
                let workItems: RunWorkItem[] = [];
                let currentItem: string | null = null;
                let startedAt = '';
                let completedAt: string | undefined;

                if (fs.existsSync(runLogPath)) {
                    const content = fs.readFileSync(runLogPath, 'utf8');
                    const parsed = this._parseRunLog(content);
                    scope = parsed.scope || 'single';
                    workItems = parsed.workItems || [];
                    currentItem = parsed.currentItem ?? null;
                    startedAt = parsed.startedAt || '';
                    completedAt = parsed.completedAt;
                }

                // Check if this is the active run
                const isActiveRun = state.activeRun?.id === runId;
                if (isActiveRun && state.activeRun) {
                    // Use state for active run info
                    scope = state.activeRun.scope;
                    workItems = state.activeRun.workItems;
                    currentItem = state.activeRun.currentItem;
                    startedAt = state.activeRun.started;
                }

                // Check completed runs in state
                const completedRun = state.runs?.completed?.find(r => r.id === runId);
                if (completedRun) {
                    completedAt = completedRun.completed;
                    workItems = completedRun.workItems || workItems;
                }

                runs.push({
                    id: runId,
                    scope,
                    workItems,
                    currentItem,
                    folderPath: runPath,
                    startedAt,
                    completedAt,
                    hasPlan,
                    hasWalkthrough,
                    hasTestReport
                });
            }
        } catch (error) {
            console.error('Error scanning runs:', error);
        }

        return runs;
    }

    /**
     * Scan standards directory.
     */
    private async _scanStandards(rootPath: string): Promise<FireStandard[]> {
        const standardsPath = path.join(rootPath, 'standards');
        if (!fs.existsSync(standardsPath)) return [];

        const standards: FireStandard[] = [];
        const standardTypes = ['constitution', 'tech-stack', 'coding-standards', 'testing-standards', 'system-architecture'] as const;

        try {
            for (const type of standardTypes) {
                const filePath = path.join(standardsPath, `${type}.md`);
                if (fs.existsSync(filePath)) {
                    standards.push({
                        type,
                        filePath,
                        scope: 'root'
                    });
                }
            }
        } catch (error) {
            console.error('Error scanning standards:', error);
        }

        return standards;
    }

    /**
     * Parse frontmatter from markdown content.
     */
    private _parseFrontmatter(content: string): Record<string, unknown> {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return {};

        try {
            return yaml.parse(frontmatterMatch[1]) || {};
        } catch {
            return {};
        }
    }

    /**
     * Parse run.md log file.
     */
    private _parseRunLog(content: string): {
        scope?: RunScope;
        workItems?: RunWorkItem[];
        currentItem?: string | null;
        startedAt?: string;
        completedAt?: string;
    } {
        const frontmatter = this._parseFrontmatter(content);

        return {
            scope: this._normalizeScope(frontmatter.scope as string),
            workItems: Array.isArray(frontmatter.work_items)
                ? frontmatter.work_items.map((w: Record<string, string>) => ({
                    id: w.id || '',
                    intentId: w.intent || '',
                    mode: this._normalizeMode(w.mode) || 'confirm',
                    status: (w.status as RunWorkItem['status']) || 'pending'
                }))
                : [],
            currentItem: (frontmatter.current_item as string | undefined) ?? null,
            startedAt: frontmatter.started as string,
            completedAt: frontmatter.completed as string
        };
    }

    /**
     * Normalize status string.
     */
    private _normalizeStatus(status: unknown): FireStatus | undefined {
        if (typeof status !== 'string') return undefined;
        const normalized = status.toLowerCase().replace(/[_-]/g, '_');
        const statusMap: Record<string, FireStatus> = {
            'pending': 'pending',
            'in_progress': 'in_progress',
            'inprogress': 'in_progress',
            'active': 'in_progress',
            'completed': 'completed',
            'done': 'completed',
            'blocked': 'blocked'
        };
        return statusMap[normalized];
    }

    /**
     * Normalize execution mode.
     */
    private _normalizeMode(mode: unknown): ExecutionMode | undefined {
        if (typeof mode !== 'string') return undefined;
        const normalized = mode.toLowerCase();
        const modeMap: Record<string, ExecutionMode> = {
            'autopilot': 'autopilot',
            'confirm': 'confirm',
            'validate': 'validate'
        };
        return modeMap[normalized];
    }

    /**
     * Normalize run scope.
     */
    private _normalizeScope(scope: unknown): RunScope | undefined {
        if (typeof scope !== 'string') return undefined;
        const normalized = scope.toLowerCase();
        const scopeMap: Record<string, RunScope> = {
            'single': 'single',
            'batch': 'batch',
            'wide': 'wide'
        };
        return scopeMap[normalized];
    }

    /**
     * Normalize complexity.
     */
    private _normalizeComplexity(complexity: unknown): Complexity | undefined {
        if (typeof complexity !== 'string') return undefined;
        const normalized = complexity.toLowerCase();
        const complexityMap: Record<string, Complexity> = {
            'low': 'low',
            'medium': 'medium',
            'high': 'high'
        };
        return complexityMap[normalized];
    }

    /**
     * Determine intent status from state or work items.
     */
    private _determineIntentStatus(stateStatus: FireStatus | undefined, workItems: FireWorkItem[]): FireStatus {
        if (stateStatus) return stateStatus;
        if (workItems.length === 0) return 'pending';

        const allCompleted = workItems.every(w => w.status === 'completed');
        if (allCompleted) return 'completed';

        const anyInProgress = workItems.some(w => w.status === 'in_progress');
        if (anyInProgress) return 'in_progress';

        const anyBlocked = workItems.some(w => w.status === 'blocked');
        if (anyBlocked) return 'blocked';

        return 'pending';
    }

    /**
     * Normalize raw YAML state (snake_case) to FireState (camelCase).
     */
    private _normalizeState(raw: RawFireState): FireState {
        return {
            project: raw.project ? {
                name: raw.project.name || '',
                description: raw.project.description,
                created: raw.project.created || '',
                fireVersion: raw.project.fire_version || raw.project.fireVersion || '0.0.0'
            } : { name: '', created: '', fireVersion: '0.0.0' },
            workspace: raw.workspace ? {
                type: raw.workspace.type || 'greenfield',
                structure: raw.workspace.structure || 'monolith',
                autonomyBias: raw.workspace.autonomy_bias || raw.workspace.autonomyBias || 'balanced',
                runScopePreference: raw.workspace.run_scope_preference || raw.workspace.runScopePreference || 'single',
                scannedAt: raw.workspace.scanned_at || raw.workspace.scannedAt,
                parts: raw.workspace.parts
            } : { type: 'greenfield', structure: 'monolith', autonomyBias: 'balanced', runScopePreference: 'single' },
            intents: (raw.intents || []).map(i => ({
                id: i.id,
                title: i.title,
                status: i.status,
                workItems: (i.work_items || i.workItems || []).map(w => ({
                    id: w.id,
                    status: w.status || 'pending' as FireStatus,
                    mode: w.mode as ExecutionMode | undefined
                }))
            })),
            activeRun: raw.active_run || raw.activeRun ? {
                id: (raw.active_run || raw.activeRun)!.id,
                scope: (raw.active_run || raw.activeRun)!.scope,
                workItems: ((raw.active_run || raw.activeRun)!.work_items || (raw.active_run || raw.activeRun)!.workItems || []).map(w => ({
                    id: w.id,
                    intentId: w.intent || w.intentId || '',
                    mode: this._normalizeMode(w.mode) || 'confirm',
                    status: (w.status as 'pending' | 'in_progress' | 'completed' | 'failed') || 'pending'
                })),
                currentItem: (raw.active_run || raw.activeRun)!.current_item || (raw.active_run || raw.activeRun)!.currentItem || '',
                started: (raw.active_run || raw.activeRun)!.started || ''
            } : null,
            runs: {
                completed: (raw.runs?.completed || []).map(r => ({
                    id: r.id,
                    workItems: (r.work_items || r.workItems || []).map(w => {
                        if (typeof w === 'string') {
                            return { id: w, intentId: r.intent || '', mode: 'confirm' as ExecutionMode, status: 'completed' as const };
                        }
                        return {
                            id: w.id,
                            intentId: w.intent || w.intentId || r.intent || '',
                            mode: this._normalizeMode(w.mode) || 'confirm',
                            status: 'completed' as const
                        };
                    }),
                    completed: r.completed || ''
                }))
            }
        };
    }
}

/**
 * Raw state from YAML (uses snake_case).
 */
interface RawFireState {
    project?: {
        name?: string;
        description?: string;
        created?: string;
        fire_version?: string;
        fireVersion?: string;
    };
    workspace?: {
        type?: 'greenfield' | 'brownfield';
        structure?: 'monolith' | 'monorepo' | 'multi-part';
        autonomy_bias?: 'autonomous' | 'balanced' | 'controlled';
        autonomyBias?: 'autonomous' | 'balanced' | 'controlled';
        run_scope_preference?: 'single' | 'batch' | 'wide';
        runScopePreference?: 'single' | 'batch' | 'wide';
        scanned_at?: string;
        scannedAt?: string;
        parts?: string[];
    };
    intents?: Array<{
        id: string;
        title: string;
        status: FireStatus;
        work_items?: Array<{ id: string; status?: FireStatus; mode?: string }>;
        workItems?: Array<{ id: string; status?: FireStatus; mode?: string }>;
    }>;
    active_run?: RawActiveRun;
    activeRun?: RawActiveRun;
    runs?: {
        completed?: Array<{
            id: string;
            intent?: string;
            scope?: string;
            work_items?: Array<string | { id: string; intent?: string; intentId?: string; mode?: string }>;
            workItems?: Array<string | { id: string; intent?: string; intentId?: string; mode?: string }>;
            completed?: string;
        }>;
    };
}

interface RawActiveRun {
    id: string;
    scope: RunScope;
    work_items?: Array<{ id: string; intent?: string; intentId?: string; mode?: string; status?: string }>;
    workItems?: Array<{ id: string; intent?: string; intentId?: string; mode?: string; status?: string }>;
    current_item?: string;
    currentItem?: string;
    started?: string;
}

/**
 * Create a FIRE parser instance.
 */
export function createFireParser(): FireParser {
    return new FireParser();
}
