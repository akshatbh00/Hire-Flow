"use client";

import KanbanColumn from "./kanban-column";

const STAGE_ORDER = [
  "applied",
  "ats_screening",
  "ats_rejected",
  "round_1",
  "round_2",
  "round_3",
  "hr_round",
  "offer",
  "selected",
  "withdrawn",
];

interface Props {
  kanban: Record<string, any[]>;
  onMove: (appId: string, toStage: string) => void;
}

export default function KanbanBoard({ kanban, onMove }: Props) {
  // only show columns that have candidates OR are core stages
  const coreStages  = ["applied","ats_screening","round_1","hr_round","selected","ats_rejected"];
  const visibleStages = STAGE_ORDER.filter(
    (s) => coreStages.includes(s) || (kanban[s]?.length ?? 0) > 0
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {visibleStages.map((stage) => (
        <KanbanColumn
          key={stage}
          stage={stage}
          candidates={kanban[stage] ?? []}
          allStages={STAGE_ORDER}
          onMove={onMove}
        />
      ))}
    </div>
  );
}