"use client";

import ClientTemplates from "../templates/client";

type Props = {
  doctorId: string;
  doctorName: string;
};

export default function SchedulePanel({ doctorId, doctorName }: Props) {
  return <ClientTemplates doctorId={doctorId} doctorName={doctorName} />;
}
