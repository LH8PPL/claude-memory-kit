---
id: P-RL2EWQBD
type: reference
title: SkillRevise earns better-skill via benchmark verifier (oracle-BOUND)
created_at: 2026-07-01T20:30:31Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 152a93c5e4957c5a9351014a267f52ac171bfde47f991808932f68623270ccd7
related: [skillrevise-learns-from-failure-only-via-a-per-task-test-ora, expel-cross-task-insights-oracle-bound-success-labels]
---

SkillRevise (arXiv 2606.01139) revises agent skills (markdown procedural docs) from execution traces, but its "skill A is better than B" judgment is ORACLE-BOUND, not oracle-free. Mechanics: each round executes the skill and gets e_i=(τ_i, v_i, r_i, c_i) where v_i is "verifier feedback or evaluation evidence" and r_i is "the outcome score or pass/fail reward." The verifier is a Diagnosis-derived verification-spec V_i ("output paths, schemas, formats, terminal sentinels, and pass/fail assertions") — and Appendix E states plainly it "mainly uses benchmark-provided verifiers and task traces." Selection = argmax utility U(S,T)=α·Δ_succ + β·g_succ·Δ_eff + γ·Δ_trans − λ·C_intf (Eq.9), where g_succ=1[succ(S,T)=1]. Δ_succ IS the benchmark task-success delta, so even the "empirical utility fallback" needs the task's ground-truth evaluator. Benchmarks: SkillsBench, SkillLearnBench, SWE-Skills-Bench, ALFWorld — all re-runnable test-based evaluators. Authors make NO oracle-free/label-free claim and explicitly warn (App. E): "its revisions are only as informative as the available feedback" and "sparse tests, opaque scoring scripts, or proxy checks may cause the diagnosis module to repair the wrong behavior, overfit to visible assertions." Repair-principle memory is 7 PRE-AUTHORED principles (Table 9 schema: trigger, defect label, repair rule, action template, verification template, transfer constraint, evidence), NOT self-generated from trajectories; optional absorption requires new principles be "evidence-backed, skill-level, utility-improving, and transferable" (utility-improving = again oracle-gated).

**Why:** Directly answers the cmk research question "can earned comparative method-judgment be oracle-free?" for the SkillRevise target. Verdict: SkillRevise is a clean example of the oracle-BOUND path — it re-validates (re-executes candidates), which is real EARNED judgment, but the earning is bought with the benchmark's own pass/fail evaluator. Not transferable to cmk's conversation-time setting (no reward oracle). The transferable half is only the SHAPE: diagnose-defect → retrieve-repair-principle → edit → re-validate, and the principle-memory schema (trigger/defect/repair-rule/verification-template/evidence).

**How to apply:** When citing SkillRevise for cmk: label its earned "A>B" as oracle-bound (benchmark test evaluator), NOT observational. What cmk CAN borrow oracle-free: (1) the principle-memory schema (trigger, defect-label, repair-rule, verification-template, evidence) as a shape for storing method-judgments; (2) the diagnose→retrieve-principle→edit→re-run loop. What cmk CANNOT borrow: the "re-execute and check succ(S,T)" retention gate — cmk has no per-task success oracle at conversation time. The honest gap SkillRevise papers over: it assumes a re-runnable task with a ground-truth evaluator, which is exactly the assumption cmk cannot make.
