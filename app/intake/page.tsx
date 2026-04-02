"use client";

import { useState, FormEvent } from "react";
import { OrgSlug } from "@/lib/types";
import { ORG_CONFIGS, INTAKE_REQUEST_TYPES, INTAKE_URGENCIES } from "@/lib/config";
import { CustomSelect } from "@/components/custom-select";

type FormState = "idle" | "submitting" | "success" | "error";

export default function IntakePage() {
  const [name, setName] = useState("");
  const [team, setTeam] = useState<OrgSlug | "">("");
  const [requestType, setRequestType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [resultTeam, setResultTeam] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!team) return;

    setState("submitting");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, team, requestType, urgency, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResultTeam(data.teamName);
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  function resetForm() {
    setName("");
    setTeam("");
    setRequestType("");
    setUrgency("");
    setDescription("");
    setState("idle");
    setErrorMsg("");
  }

  if (state === "success") {
    return (
      <div className="pt-10 animate-in">
        <h1 className="text-xl font-bold tracking-tight mb-1">Intake</h1>
        <div className="bg-surface border border-green/20 rounded-xl p-10 mt-6 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green/10 mb-4">
            <svg className="w-7 h-7 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-semibold text-lg mb-2">Request submitted</h2>
          <p className="text-text-secondary text-sm mb-6">
            Request submitted to <span className="text-text font-medium">{resultTeam}</span>. Your PM will respond within one sprint.
          </p>
          <button
            onClick={resetForm}
            className="bg-accent hover:bg-accent/80 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-accent/20"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  const inputClasses = "w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all";

  return (
    <div className="pt-10 animate-in">
      <h1 className="text-xl font-bold tracking-tight mb-1">Intake</h1>
      <p className="text-text-secondary text-sm mb-6">
        Submit a request to any Amplify team.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg bg-surface border border-border rounded-2xl p-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Team</label>
          <CustomSelect
            value={team}
            onChange={(v) => setTeam(v as OrgSlug)}
            options={ORG_CONFIGS.map((c) => ({ value: c.slug, label: c.label }))}
            placeholder="Select a team"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Request type</label>
          <CustomSelect
            value={requestType}
            onChange={setRequestType}
            options={INTAKE_REQUEST_TYPES.map((t) => ({ value: t, label: t }))}
            placeholder="Select type"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Urgency</label>
          <div className="flex gap-3 flex-wrap">
            {INTAKE_URGENCIES.map((u) => (
              <label
                key={u}
                className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border transition-all ${
                  urgency === u
                    ? "text-accent-light bg-accent/10 border-accent/30"
                    : "text-text-secondary bg-surface border-border hover:border-border/80"
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={u}
                  required
                  checked={urgency === u}
                  onChange={() => setUrgency(u)}
                  className="sr-only"
                />
                {u}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What do you need and why?"
            className={`${inputClasses} resize-none`}
          />
        </div>

        {state === "error" && (
          <div className="flex items-start gap-3 text-red text-sm bg-red/8 border border-red/20 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-accent/20"
        >
          {state === "submitting" ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit request"
          )}
        </button>
      </form>
    </div>
  );
}
