type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next || "/";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <form action="/api/auth/login" method="post" className="w-full rounded-3xl bg-white p-8 shadow-sm">
        <input type="hidden" name="next" value={next} />
        <p className="text-sm uppercase tracking-[0.3em] text-moss">Private log</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Sign in</h1>
        <p className="mt-3 text-sm text-stone-600">
          Enter the single app password configured in <code>APP_PASSWORD</code>.
          In local development without a password, any value is accepted.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
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
          className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          required
        />
        <button className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss">
          Continue
        </button>
      </form>
    </div>
  );
}
