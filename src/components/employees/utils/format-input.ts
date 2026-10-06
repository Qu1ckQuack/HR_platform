export function formatWithGroups(value: string, groups: number[]) {
  const digits = value.replace(/\D/g, "").slice(
    0,
    groups.reduce((total, size) => total + size, 0),
  );
  let cursor = 0;
  return groups
    .map((size) => {
      const part = digits.slice(cursor, cursor + size);
      cursor += size;
      return part;
    })
    .filter(Boolean)
    .join("-");
}

export function formatCitizenId(value: string) {
  return formatWithGroups(value, [1, 4, 5, 2, 1]);
}

export function formatPhone(value: string) {
  return formatWithGroups(value, [3, 3, 4]);
}
