// types/index.ts - Типы для календаря врача

import type { EventInput } from "@fullcalendar/core";

// ================= API Response Types =================

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED" | "NO_SHOW";

export interface ApiOpening {
  id: string;
  start?: string;
  startUtc?: string;
  end?: string;
  endUtc?: string;
}

export interface ApiException {
  id: string;
  start?: string;
  startUtc?: string;
  end?: string;
  endUtc?: string;
  reason?: string;
  kind?: string;
}

export interface ApiBooking {
  id: string;
  start?: string;
  startUtc?: string;
  end?: string;
  endUtc?: string;
  status?: BookingStatus;
  title?: string;
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  note?: string;
}

export interface CalendarApiResponse {
  openings?: ApiOpening[];
  exceptions?: ApiException[];
  bookings?: ApiBooking[];
  busy?: ApiBooking[]; // альтернативное поле для bookings
  unavailabilities?: any[]; // недоступности/блокировки
}

// ================= Calendar Event Types =================

export type CalendarEventType = "opening" | "exception" | "booking" | "unavailability";

export interface CalendarEventExtendedProps {
  type: CalendarEventType;
  backendId: string;
  status?: BookingStatus;
  reason?: string;
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  note?: string;
}

export interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  editable?: boolean;
  extendedProps?: CalendarEventExtendedProps;
}

// ================= Modal State Types =================

export interface SelectionState {
  start: Date;
  end: Date;
}

export interface EditTargetState {
  type: CalendarEventType;
  id: string;
  start: Date | null;
  end: Date | null;
  title?: string;
  reason?: string;
}

export interface StatusTargetState {
  id: string;
  current: BookingStatus;
}

export type WhichCreateState = null | "chooser" | "opening" | "exception";

// ================= Form Types =================

export interface OpeningFormValues {
  startLocal: string;
  endLocal: string;
}

export interface ExceptionFormValues extends OpeningFormValues {
  reason?: string;
}

export interface StatusFormValues {
  status: BookingStatus;
}

// ================= Component Props =================

export interface ClientCalendarProps {
  doctorId: string;
  tzid?: string;
  doctorName?: string;
  bufferMin?: number; // Буфер между записями в минутах
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export interface FormModalBaseProps {
  open: boolean;
  mode: "create" | "edit";
  initialStart?: Date | null;
  initialEnd?: Date | null;
  tzid: string;
  onClose: () => void;
  onDelete?: (() => void) | null;
}

export interface OpenFormModalProps extends FormModalBaseProps {
  onSubmit: (data: { startIso: string; endIso: string }) => Promise<void>;
}

export interface ExceptionFormModalProps extends FormModalBaseProps {
  initialReason?: string;
  onSubmit: (data: { startIso: string; endIso: string; reason?: string }) => Promise<void>;
}

export interface StatusModalProps {
  open: boolean;
  current: BookingStatus;
  onClose: () => void;
  onSubmit: (status: BookingStatus) => Promise<void>;
}
