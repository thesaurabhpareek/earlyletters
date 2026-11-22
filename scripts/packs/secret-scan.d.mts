/** Types for secret-scan.mjs (plain Node so it runs before `npm ci`, for example in a pre-commit step). */
export declare const SECRET_PATTERNS: readonly { name: string; re: RegExp }[];
export declare function scanText(text: string): { line: number; name: string }[];
export declare function scanRepo(cwd: string, opts?: { staged?: boolean }): { file: string; line: number; name: string }[];
export declare function main(argv?: string[], cwd?: string): number;
