"use client";

import ClientCalendar from "../calendar/client";

type Props = {
  doctorId: string;
  tzid: string;
  doctorName: string;
  bufferMin?: number;
};

export default function CalendarPanel({ doctorId, tzid, doctorName, bufferMin }: Props) {
  return (
    <ClientCalendar
      doctorId={doctorId}
      tzid={tzid || "UTC"}
      doctorName={doctorName}
      bufferMin={bufferMin ?? 15}
    />
  );
}
