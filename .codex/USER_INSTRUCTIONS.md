# Your instructions

Write project-level directions for Codex below. Keep the newest or highest
priority instruction at the top.

## Current instructions

_use drizzle orm and pg db to create these entities and it's attribute_
_TABLE พนักงาน
- รหัสพนักงาน `PK`
- คำนำหน้า `NOT NULL`
- ชื่อเล่น
- ชื่อ (ไทย) `NOT NULL`
- นามสกุล (ไทย) `NOT NULL`
- Full Name (EN)
- อีเมลบริษัท `UNIQUE`
- โทรศัพท์
- เพศกำเนิด `NOT NULL`
- ที่อยู่
- อีเมลส่วนตัว `UNIQUE`

Fact table ข้อมูลการจ้างงาน
- หมายเลขสัญญา PK
- รหัสพนักงาน (FK ref พนักงาน(รหัสพนักงาน)) `NOT NULL`
- ประเภทการจ้งงาน `NOT NULL` (งานประจำ | พาร์ทไทม์ | สัญญาจ้างชั่วคราว | ฟรีแลนซ์)
- วันที่เริ่มงาน `NOT NULL`
- วันสิ้นสุดการการจ้าง
- สถานะการจ้างงาน `NOT NULL` (ทดลองงาน | จ้างงาน | พ้นสภาพ)

TABLE แผนก
- รหัสแผนก PK
- ชื่อแผนก NOT NULL

TABLE ตำแหน่ง
- รหัสตำแหน่ง 
- ชื่อตำแหน่ง NOT NULL
- รหัสแผนก (FK ref แผนก(รหัสแผนก))

Table ประวัติการดำรงตำแหน่ง
- รหัสประวัติ `PK` (surrogate id)
- หมายเลขสัญญา (FK ref ข้อมูลการจ้างงาน(หมายเลขสัญญา)) `NOT NULL`
- รหัสตำแหน่ง (FK ref ตำแหน่งงาน(รหัสตำแหน่ง)) `NOT NULL`
- รหัสแผนก (FK ref แผนก(รหัสแผนก)) `NOT NULL`
- หัวหน้างาน (FK ref พนักงาน(รหัสพนักงาน))
- ตั้งแต่วันที่ `NOT NULL`
- ถึงวันที่  (NULL = ยังดำรงอยู่ปัจจุบัน)

constraint เพิ่มเติม
เมื่อ super admin ยืนยันว่าจะลบ ลบทุก records พนักงาน, การลา WHERE รหัสพนักงาน ตรงกัน ได้เมื่อ CHECK เงื่อนไข
1. สถานะการจ้างงาน === 'พ้นสภาพ'
2. กรณี ประเภทการจ้างงาน = 'สัญญาจ้างชั่วคราว' ==AND== entity ข้อมูลการจ้างงาน attribute วันสิ้นสุดการจ้างงาน <= datetime.now()

ค่าที่ UPDATE ไม่ได้
1. id ต่างๆ
_

## Helpful details to include

- The outcome you want and who will use it.
- Required pages, features, data, integrations, or design
 references.
- Constraints such as deadlines, supported devices, accessibility, or things
  that must not change.
- How you want work verified and what “done” means.
