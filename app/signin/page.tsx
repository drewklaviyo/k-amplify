import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🔥</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-2">
            Base K:Amplify
          </h1>
          <p className="text-text-secondary text-sm">
            Our climb to 501K hours saved
          </p>
        </div>

        {/* Sign in card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/30">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-text mb-1">Welcome back</h2>
            <p className="text-text-secondary text-sm">
              Sign in with your Klaviyo account to continue
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("okta", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-accent/15 hover:bg-accent/25 text-accent-light font-semibold text-sm rounded-xl border border-accent/30 hover:border-accent/50 transition-all duration-200 shadow-lg shadow-accent/10 hover:shadow-accent/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                  fill="currentColor"
                />
              </svg>
              Sign in with Okta
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary/50 text-xs">
              Klaviyo employees only
            </p>
          </div>
        </div>

        {/* Mountain and goat */}
        <div className="text-center mt-8">
          <div className="text-4xl mb-2">🐐</div>
          <p className="text-text-secondary/40 text-xs">
            kamplify.team
          </p>
        </div>
      </div>
    </div>
  );
}
