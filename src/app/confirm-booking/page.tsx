import { Suspense } from "react";
import ConfirmBookingClient from "./ConfirmBookingClient";

function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFCF3] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <div className="animate-spin w-12 h-12 border-4 border-[#5C6744] border-t-transparent rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-ManropeMedium text-[#4F5338]">
          Подтверждаем запись...
        </h2>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfirmBookingClient />
    </Suspense>
  );
}
