"use client";
import { Suspense } from "react";

function AuditContent() {
  return <div><h1>Audit Page</h1></div>;
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuditContent />
    </Suspense>
  );
}