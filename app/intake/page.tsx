"use client";

import { useState, FormEvent } from "react";
import { OrgSlug } from "@/lib/types";
import { ORG_CONFIGS, INTAKE_REQUEST_TYPES, INTAKE_URGENCIES } from "@/lib/config";

type FormState = "idle" | "submitting" | "success" | "error";

export default function IntakePage() {
  const [name, setName] = useState("");
  const [team, setTeam] = useState<OrgSlug | "">(""  );
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
      <div className="pt-10">
        <h1 className="text-xl font-bold tracking-tight mb-1">Intake</h1>
        <div className="bg-surface border border-border rounded-xl p-8 mt-6 text-center">
          <div className="text-green text-3xl mb-3">&#10003;</div>
          <h2 className="font-semibold text-lg mb-2">Request submitted</h2>
          <p className="text-text-secondary text-sm mb-6">
            Request submitted to {resultTeam}. Your PM will respond within one sprint.
          </p>
          <button
            onClick={resetForm}
            className="bg-accent hover:bg-accent/80 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <h1 className="text-xl font-bold tracking-tight mb-1">Intake</h1>
      <p className="text-text-secondary text-sm mb-6">
        Submit a request to any Amplify team.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Team</label>
          <select
            required
            value={team}
            onChange={(e) => setTeam(e.target.value as OrgSlug)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
          >
            <option value="" disabled>Select a team</option>
            {ORG_CONFIGS.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Request type</label>
          <select
            required
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
          >
            <option value="" disabled>Select type</option>
            {INTAKE_REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Urgency</label>
          <div className="flex gap-4">
            {INTAKE_URGENCIES.map((u) => (
              <label key={u} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  value={u}
                  required
                  checked={urgency === u}
                  onChange={() => setUrgency(u)}
                  className="accent-accent"
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
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>

        {state === "error" && (
          <div className="text-red text-sm bg-red/10 border border-red/25 rounded-lg px-4 py-2">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {state === "submitting" ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
