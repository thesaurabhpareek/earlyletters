// Marker line the grade host prints before its JSON result. Lives in its own module because
// grade-host.mjs runs its top-level code on import: importing MARK from there made every runner
// call execute a grader with no arguments and print a stray failure line (review R323-b).
export const MARK = "\u0001EVAL_RESULT:";
