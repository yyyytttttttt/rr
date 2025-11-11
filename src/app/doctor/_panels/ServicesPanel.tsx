"use client";

import DoctorServicesClient from "../services/client";

type Props = {
  doctorId: string;
  doctorName: string;
};

export default function ServicesPanel({ doctorId, doctorName }: Props) {
  return <DoctorServicesClient doctorId={doctorId} doctorName={doctorName} />;
}
