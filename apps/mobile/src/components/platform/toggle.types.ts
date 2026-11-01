/** Props shared by platform/toggle.{ios,}.tsx (COMPONENTS 2.10). */
export type ToggleProps = {
  /** Accessible name. The visible label lives in the row (ListRow) next to the switch. */
  label: string;
  /** Read as the accessibility hint. */
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  testID?: string;
};
