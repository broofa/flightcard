import { LoginProtected } from '@/app/LoginProtected';

export default function Home() {
  return (
    <div
      className='grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'
      suppressHydrationWarning
    >
      <main className='flex flex-col gap-8 prow-start-2 items-center w-80'>
        <h1>Welcome to FlightCard</h1>
        <LoginProtected>hello</LoginProtected>
      </main>
    </div>
  );
}
