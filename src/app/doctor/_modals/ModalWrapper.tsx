"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
};

export default function ModalWrapper({ open, onClose, title, children, maxWidth = "52rem" }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-[10000] w-[calc(100%-2rem)] max-h-[90vh] overflow-hidden"
          style={{ maxWidth: `clamp(36rem,32rem+16vw,${maxWidth})` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex-shrink-0 p-1 text-[#636846] hover:text-[#4F5338] transition-colors rounded-lg hover:bg-[#F5F0E4]"
                aria-label="Закрыть"
              >
                <svg
                  className="w-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] h-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
