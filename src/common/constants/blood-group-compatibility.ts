export const BLOOD_GROUP_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
} as const;

export type BloodGroup = keyof typeof BLOOD_GROUP_COMPATIBILITY;

export function getCompatibleRecipientGroups(donorGroup: BloodGroup): BloodGroup[] {
  return (Object.entries(BLOOD_GROUP_COMPATIBILITY) as [
    BloodGroup,
    readonly BloodGroup[],
  ][])
    .filter(([, donorGroups]) => donorGroups.includes(donorGroup))
    .map(([recipientGroup]) => recipientGroup);
}
