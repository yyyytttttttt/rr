export default function ServiceCard({ title, desc }) {
  return (
    <div className="rounded-2xl border border-[#E5E0D5] bg-white p-6 lg:p-8">
      <div className="text-[20px] lg:text-[22px] font-[Manrope-SemiBold] leading-[1.2] text-[#2F2D28]">
        {title}
      </div>

      <p className="mt-4 line-clamp-3 text-[14px] lg:text-[15px] leading-[1.6] font-[Manrope-Regular] text-[#967450]">
        {desc}
      </p>

      <button
        type="button"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#EFEBE3] px-6 text-[14px] font-[Manrope-Medium] text-[#2F2D28] transition-colors hover:bg-[#E5E0D5]"
      >
        Перейти
      </button>
    </div>
  );
}
