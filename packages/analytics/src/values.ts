/**
 * Shared value sets for the analytics catalogue: enums and buckets reused by
 * several events. Split out of catalog.ts so the registry (registry.ts) and
 * the held events (catalog.ts) can both use them without a cycle.
 */
import { CAPTURE_MODES, MEMBER_ROLES, OFFER_TRIGGERS } from '@scribe/core';
import { oneOf } from './schema';


// ---------------------------------------------------------------------------
// Shared value sets
// ---------------------------------------------------------------------------

export const CHILD_ORDINAL = oneOf('first', 'second', 'third_plus');
export const CHILD_COUNT_BUCKET = oneOf('none', 'one', 'two', 'three_plus');
/**
 * The viewer's role in the current child's book (B section 6). DB values from
 * @scribe/core: the UI's "Co-parent" is `parent` here (CORE-05).
 */
export const MEMBER_ROLE = oneOf(...MEMBER_ROLES);
/** Role an invite grants: the same DB values as MEMBER_ROLE. */
export const INVITE_ROLE = MEMBER_ROLE;
/** Who wrote a letter, relative to the person viewing it. */
export const AUTHOR_RELATION = oneOf('self', 'other_parent', 'family');
/** entries.capture_mode, from @scribe/core (includes `mixed`). */
export const CAPTURE_MODE = oneOf(...CAPTURE_MODES);
/** packages/core PromptKind, plus `none` when no prompt was shown. */
export const PROMPT_KIND = oneOf('opening', 'gap', 'hard', 'family', 'together', 'none');
export const AUDIO_BUCKET = oneOf('lt_15s', '15_60s', '1_2m', '2_5m', 'gt_5m');
export const WORDS_BUCKET = oneOf('lt_25', '25_99', '100_299', '300_plus');
export const LETTERS_BUCKET = oneOf('0', '1', '2_4', '5_9', '10_49', '50_99', '100_364', '365_plus');
export const LATENCY_BUCKET = oneOf('lt_5s', '5_15s', '15_30s', '30_60s', 'gt_60s');
export const DAYS_BUCKET = oneOf('d0', 'd1', 'd2_7', 'd8_30', 'd31_90', 'd91_plus');
export const SESSION_BUCKET = oneOf('lt_1m', '1_5m', '5_15m', 'gt_15m');
/** packages/core EditType (a type test keeps them equal). */
export const EDIT_TYPE = oneOf('filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph');
export const EDIT_SOURCE = oneOf('rule', 'model');
/** packages/core RejectReason (a type test keeps them equal). Why the verifier refused a machine edit. */
export const REJECT_REASON = oneOf(
  'original_mismatch',
  'changes_invisible',
  'out_of_bounds',
  'overlaps_protected',
  'overlaps_other_edit',
  'type_not_allowed_at_level',
  'removal_only',
  'not_a_filler',
  'not_a_repeat',
  'false_start_not_repeated',
  'stt_fix_not_dictionary',
  'punctuation_changed_letters',
  'agreement_not_single_word',
  'agreement_stem_mismatch',
  'agreement_limit_per_sentence',
  'paragraph_not_whitespace',
  'inserted_content_word',
  'change_ceiling_exceeded',
  'splits_word',
  'removal_adds_punctuation',
  'changes_negation',
  'changes_tense',
  'changes_modal',
  'changes_word',
  'changes_number',
  'changes_sentence_type',
  'changes_quotes',
  'case_change_not_allowed',
  'case_change_not_sentence_start',
  'removes_negation',
  'repeat_is_emphasis',
  'false_start_complete_phrase',
  'stt_fix_protected_word',
  'stt_fix_not_heard_as',
  'not_vetted_for_language',
);
/** Sign-in methods (apps/mobile src/lib/auth AuthMethod). Passkeys are behind a flag at v1.0. */
export const AUTH_METHOD = oneOf('apple', 'google', 'email', 'passkey');
/** Where the sign-in sheet was opened from (src/lib/auth SignInTrigger). */
export const SIGN_IN_TRIGGER = oneOf('first_letter', 'invite', 'invite_create', 'sign_in', 'settings');
/** packages/core OfferTrigger. */
export const PLUS_TRIGGER = oneOf(...OFFER_TRIGGERS);
export const NETWORK = oneOf('wifi', 'cellular', 'none', 'unknown');
/** Speech model in use, by role (src/lib/models/catalog.ts; ADR 0015). Never a file name or URL. */
export const SPEECH_MODEL = oneOf('turbo', 'small', 'hindi_small', 'zh_turbo', 'server_default', 'none');

/**
 * Spoken-letter languages in v1.0 (founder decision 6, 3 Oct 2026), as ISO
 * 639-1 primary subtags: English, Hindi, Spanish, Mandarin Chinese, French,
 * Arabic, Portuguese. A closed list: a language outside it is never sent.
 */
export const LANG = oneOf('en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt');
export type Lang = (typeof LANG.values)[number];
export const V1_LANGUAGES: readonly Lang[] = LANG.values;

/**
 * Downloadable packs (founder decision 15), by a short analytics id derived
 * from the signed manifest's pack id (`packAnalyticsId` in packs.ts). A pack
 * the catalogue does not know is sent as `other`, so failures are still
 * counted, but its id never is.
 */
export const PACK_ID = oneOf(
  'rules_en', 'rules_hi', 'rules_es', 'rules_zh', 'rules_fr', 'rules_ar', 'rules_pt',
  'prompts_en', 'prompts_hi', 'prompts_es', 'prompts_zh', 'prompts_fr', 'prompts_ar', 'prompts_pt',
  'model_vad', 'model_turbo', 'model_small', 'model_hindi_small', 'model_zh_turbo',
  'other',
);
/** src/lib/packs PackFailure. */
export const PACK_FAILURE = oneOf(
  'no_manifest',
  'not_in_manifest',
  'needs_app_update',
  'downloads_paused',
  'waiting_for_wifi',
  'offline',
  'no_space',
  'hash_mismatch',
  'download_failed',
  'cancelled',
  'storage_error',
);

/** Route templates only, never resolved paths (dynamic segments stay literal). Map: routes.ts. */
export const ROUTE = oneOf(
  'tonight',
  'book',
  'family',
  'listen',
  'write',
  'review',
  'letter_detail',
  'onboarding',
  'read_together',
  'sign_in',
  'sign_in_email',
  'sign_in_code',
  'sign_in_verify',
  'sign_in_consent',
  'invite',
  'invite_new',
  'settings',
  'settings_account',
  'settings_appearance',
  'settings_reminders',
  'settings_recordings',
  'settings_child_detail',
  'settings_child_new',
  'settings_privacy',
  'settings_export',
  'settings_language',
  'settings_plus',
  'settings_storage',
  'settings_delete_account',
);

export const ERROR_CODE = oneOf(
  'save_failed',
  'mic_denied',
  'transcription_failed',
  'offline',
  'backup_failed',
  'invite_expired',
  'storage_low',
  'generic',
);

