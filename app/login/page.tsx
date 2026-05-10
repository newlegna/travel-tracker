type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next || "/";

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md items-center px-1">
      <form
        action="/api/auth/login"
        method="post"
        className="w-full rounded-2xl border border-stone-200/80 bg-white p-8 shadow-card"
      >
        <input type="hidden" name="next" value={next} />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">Private log</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Enter the single app password configured in <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">APP_PASSWORD</code>.
          In local development without a password, any value is accepted.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-800">
            That password did not match.
          </p>
        ) : null}
        <label className="mt-6 block text-sm font-medium text-stone-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm shadow-card outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          required
        />
        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-moss"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
