'use client'
import { useRef } from 'react'
import { usePDF } from "react-to-pdf"

export default function EmployeeReport() {
    const { toPDF, targetRef } = usePDF({
        filename: "employee-report.pdf",
    });

    const targetRef = useRef<HTMLDivElement>(null);

    return (
        <>
        </>
    )
}