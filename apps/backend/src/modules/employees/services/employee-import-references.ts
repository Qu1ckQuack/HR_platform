type ImportOptions = {
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; name: string; departmentId: string }>;
  supervisors: Array<{ id: string; employeeCode: string; name: string }>;
};

export function resolveEmployeeImportReferences(
  row: Record<string, string>,
  options: ImportOptions,
): Record<string, string> {
  const resolved = { ...row };
  const department = findOption(resolved.departmentId, options.departments);
  if (department) resolved.departmentId = department.id;

  const positions = options.positions.filter((item) =>
    !department || item.departmentId === department.id,
  );
  const position = findOption(resolved.positionId, positions);
  if (position) resolved.positionId = position.id;

  const supervisorValue = resolved.supervisorEmployeeId?.trim().toLocaleLowerCase();
  const byCode = options.supervisors.find((item) =>
    [item.id, item.employeeCode].some((value) => value.trim().toLocaleLowerCase() === supervisorValue),
  );
  const byName = options.supervisors.filter((item) =>
    item.name.trim().toLocaleLowerCase() === supervisorValue,
  );
  const supervisor = byCode ?? (byName.length === 1 ? byName[0] : undefined);
  if (supervisor) resolved.supervisorEmployeeId = supervisor.employeeCode;
  return resolved;
}

function findOption<T extends { id: string; name: string }>(value: string, options: T[]) {
  const normalized = value?.trim().toLocaleLowerCase();
  return options.find((item) =>
    item.id.toLocaleLowerCase() === normalized || item.name.trim().toLocaleLowerCase() === normalized,
  );
}
