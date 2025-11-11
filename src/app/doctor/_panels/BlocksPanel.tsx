"use client";

import ClientUnavailability from "../unavailability/client";

type Props = {
  doctorId: string;
  doctorName: string;
  tzid: string;
};

export default function BlocksPanel({ doctorId, doctorName, tzid }: Props) {
  return (
    <ClientUnavailability
      doctorId={doctorId}
      doctorName={doctorName}
      doctorTzid={tzid || "UTC"}
      userRole="DOCTOR"
    />
  );
}
