export default function DashboardTopBar() {
  return (
    <header className="sticky top-0 z-20 flex w-full items-center justify-end px-8 py-4 border-b border-black/[0.04] bg-[rgba(248,249,250,0.90)] shadow-[0_1px_0_rgba(0,0,0,0.03),0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl">
      <form action="/api/auth/signout" method="post" className="shrink-0">
        <button
          type="submit"
          className="rounded-full border border-black/[0.07] bg-white px-4 py-1.5 text-[13px] font-medium text-neutral-500 shadow-sm transition-[background,color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-neutral-50 hover:text-neutral-800 active:scale-[0.97]"
        >
          Sign out
        </button>
      </form>
    </header>
  )
}
