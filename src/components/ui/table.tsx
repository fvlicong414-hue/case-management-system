import React from "react";
import clsx from "clsx";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">{children}</thead>;
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={clsx("border-b border-gray-200 px-4 py-2.5 text-left font-medium", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={clsx("border-b border-gray-100 px-4 py-2.5 align-middle", className)}>{children}</td>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={clsx("hover:bg-gray-50", className)}>{children}</tr>;
}
