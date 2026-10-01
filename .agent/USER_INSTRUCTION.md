# Your instructions

Create mvp HR management system according to my requirement any question, can't debug told me it's on me
*** Don't do CRUD, boilerplate, API, reuseable components work that mine

## Current instructions

ทำเสร็จแต่ละข้อให้บันทึก log ทันที มีคำถามให้ถามผม

1. ข้อมูลที่ต้องเก็บเพิ่มเติม (sensitive data เก็บตาราง PersonalData) ? = optional, * = required
- ศาสนา? default ไม่มีศาสนา
- ความพิการ?
- ประวัติอาชญากรรม? 
- ค่าตอบแทน/เงินเดือน*
* ถ้าเป็นไปได้อยากให้ code ส่วน migrate อ่านง่าย ชื่อไฟล์ก็ต้องอ่านแล้วสื่อความหมาย แบ่งโค้ดยังไงก็ได้ให้อ่านง่ายให้ดีให้มัน migrate ไม่เกิน 3 ครั้ง(สามารถลบ แล้ว migrate ใหม่ได้)

2. สิ่งที่ต้องทำเพิ่ม
- ตรวจสอบ logic การ soft delete ส่วนของ พนักงานหมดสัญญา ที่ไม่ต่อสัญญา
- ตรวจสอบ logic การ soft delete ในตาราง<tr> หน้า /employees
- เพิ่ม overlay ให้ notification box และทำให้มันไม่สามารถอยู่เลย top-nav bar ได้ในทุกกรณี
- จัดการเรื่องสิทธิการเข้าถึงข้อมูลเข้มงวดกว่านี้ 
- button faClockRotateLeft event -> ดูประวัติการดำรงตำแหน่งได้
- button faTrashCan -> soft delete ผู้ใช้ 7 วันให้หลังถึงลบจริง
- เช็คว่า RBAC ถูก enforce หรือไม่
- ปุ่ม คอลัม เมื่อกด จะเปลี่ยนเป็นคำว่า แถว 

## Helpful details to include

1. The outcome user want and who will use it.
- ผลลัพธ์ที่อยากได้คือ instructions ของผม ทำออกมาอย่างถูกต้อง แต่ละฟังก์ชั่นแยกกันทำงานอย่างชัดเจน code clean ไม่พันกัน ไม่ over-engineering
2. Required pages, features, data, integrations, or design
 references.
- 
3. Constraints such as deadlines, supported devices, accessibility, or things
  that must not change.
- old UI mustn't be change
4. How user want work verified and what “done” means.
- แต่ละ features ทำงานอย่างถูกต้อง, เพิ่ม field ไม่ขาดไม่เกิน


## Employee Page Refactoring Plan (2026-10-05)

### Problem

`src/components/employees/EmployeePage.tsx` is a 1,268-line monolith containing
10+ components, types, and utilities all in one file.

### Target Structure

```text
src/components/employees/
├── EmployeePage.tsx              ← Slim orchestrator (~120 lines)
├── EmployeeHeader.tsx            ← Top navigation bar
├── EmployeeToolbar.tsx           ← Title, subtitle, action buttons (import/add)
├── EmployeeStatusFilter.tsx      ← Status pill filters (all/active/probation)
├── EmployeeSearchBar.tsx         ← Search input + dropdowns + view toggle + export
├── EmployeeTable.tsx             ← Table with thead, tbody, row rendering, skeleton, error/empty
├── EmployeeTableRow.tsx          ← Single employee row with action buttons
├── EmployeeTableSkeleton.tsx     ← Loading skeleton row
├── EmployeePagination.tsx        ← Footer pagination controls
├── EmployeeEditModal.tsx         ← Create/Edit employee modal (form + submission)
├── EmployeeViewDrawer.tsx        ← Side drawer for viewing employee details
├── EmployeeHistoryModal.tsx      ← Position history modal
├── EmployeeNotificationItem.tsx  ← (already exists, keep as-is)
├── EmployeeNotifications.tsx     ← (already exists, keep as-is)
├── form/
│   ├── FormInput.tsx             ← Reusable labeled text input
│   ├── FormSelect.tsx            ← Reusable labeled select dropdown
│   └── types.ts                  ← EmployeeEditForm, EmployeeFormOptions types
└── utils/
    ├── format-contract.ts        ← formatContractDeadline
    └── format-input.ts           ← formatWithGroups, formatCitizenId, formatPhone
```

### Rules

- **Zero behavior change** — purely structural, no visual or functional differences.
- **Old UI must not change** — same styling, same layout, same interactions.
- All state management stays in `EmployeePage.tsx`; children receive props only.
- `Pill` component (status filter button) lives inside `EmployeeStatusFilter.tsx`.
- `ExportPdfButton` lives inside `EmployeeSearchBar.tsx`.

### Migration Order (bottom-up)

1. Extract `utils/` (pure functions, zero risk)
2. Extract `form/` components (self-contained, no state)
3. Extract leaf components: `EmployeeTableSkeleton` → `EmployeeTableRow` → `EmployeePagination`
4. Extract composed components: `EmployeeTable` → `EmployeeSearchBar` → `EmployeeStatusFilter` → `EmployeeToolbar` → `EmployeeHeader`
5. Extract modals/drawers: `EmployeeEditModal` → `EmployeeViewDrawer` → `EmployeeHistoryModal`
6. Final slim-down of `EmployeePage.tsx` to orchestrator-only