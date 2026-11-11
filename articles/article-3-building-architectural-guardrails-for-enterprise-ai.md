# Keeping AI on the Straight and Narrow

## How Illuminatio combines dynamic AI planning with deterministic control

“Guardrails” has become an overused marketing term and catch-all in AI. It can mean prompt instructions, content filters, permissions, human review or almost any mechanism intended to make a model safer. That breadth makes the word sound reassuring while saying very little about what is actually enforced.

I use it more narrowly here. A guardrail is an enforceable boundary outside the model that determines which tasks exist, which data can be seen, whether a proposed decision is valid and whether it may produce an effect. A prompt may influence behaviour. A guardrail must be able to stop it.

Coding agents such as Codex and Claude Code can appear remarkably autonomous. Give them a goal and they create a plan, select a tool, perform a task, inspect the result, revise the plan and continue until the goal is achieved—or until they can explain why it cannot be.

The model is only part of that system. It does not edit a disk, compile code or run a test by thought alone. Deterministic tools perform the work. The AI dynamically chooses and sequences those tools.

Illuminatio applies the same idea to enterprise finance:

> **The AI writes and revises the plan. The application owns the verbs.**

The result is neither a fixed workflow nor unrestricted autonomy. It is a goal-directed Chain of Thought cycle in which the model can investigate, reconcile and re-evaluate while every actual task remains bounded by schemas, security, rules, workflow and tests.

## AI is a dynamic control loop

An AI investigation can be reduced to a simple cycle:

> **Goal → plan → task → validate → execute → observe → reconcile → revise or stop**

The model decides what the user is asking, what evidence is needed, which task should run next and whether the returned evidence satisfies the goal. It may discover a new relationship, revisit an assumption or choose a different presentation.

The application performs the deterministic work: queries, filtering, joins, calculations, rule evaluation, workflow operations, persistence and rendering.

This distinction matters. Hard-coding every investigation path would produce a decision tree with a chat interface. Letting the model perform arbitrary operations would produce an unacceptable security and operational risk. The useful middle ground is dynamic planning over a controlled language of tasks.

## The graph document teaches the AI what work exists

The AI understands Illuminatio through a machine-readable graph document.

Each node describes a registered capability: its business purpose, inputs, permitted operators, output fields, row meaning, evidence value, limitations and navigation intent. An edge describes a meaningful relationship such as a join, comparison or process flow.

A simplified path might look like this:

> **Settlement instruction → Treasury payment → Charge → Rule evaluation → Workflow item**

The graph does more than list APIs. It explains that a settlement instruction can lead to a treasury payment through an external reference, that an amount difference may be explained by charges, and that a rule outcome may lead to an active operations work item.

The model can therefore construct a route through the application rather than receive a route hard-coded for one prompt.

> **The model owns the route through the graph. The application owns every node and its execution.**

The graph describes possibility, not permission. The model sees an authorised projection of the available capabilities, and the platform checks identity, tenant, role, inputs and bounds again when a selected task executes. Discovering a path never grants access to it.

The same design also reduces token consumption. The model does not need the whole codebase, every API description or thousands of raw data rows in its context. The graph provides a compact semantic map; QueryBuilder, DataSet and rule engines perform the heavy deterministic work; and the AI receives only bounded results and summaries relevant to its next decision.

Persisted artifacts can be referenced and refined in later steps instead of repeatedly sending the original evidence or conversation back to the model. This keeps context focused, lowers cost and latency, and reduces the risk that important evidence is diluted by irrelevant tokens.

## Better architecture improves the AI decision

Much of my earlier work on AI-assisted development focused on stacking the deck in favour of a useful result.

KISS, standard technology, consistent architecture, clear domain language and a strong corpus of code, schemas, rules, workflows and tests reduce the amount the model must infer. The closer the application stays to recognisable patterns, the fewer bad choices the AI has available.

Those practices improve the probability of a good decision. They do not prove that the decision is valid or allowed.

That is the crucial distinction:

> **Reasoning is not validation. Reasoning is not authorisation.**

Chain of Thought helps the model plan and revise its investigation, but users do not need a transcript of private model reasoning. They need an observable chain of work: what the system understood, which capability it selected, what evidence returned, why another step was needed and why the investigation stopped.

In Illuminatio, consequential reasoning becomes a task contract, plan, evidence artifact, rejected candidate, limitation or stop decision. The model remains adaptive while the durable record remains concrete and auditable.

## Deterministic controls validate each selected task

Each layer answers a different question.

- **The task contract** records what the AI believes the user wants and defines the acceptance criteria.
- **The capability schema** determines whether the selected operation and inputs are supported.
- **Authentication** establishes the effective user or explicit system principal.
- **Authorisation** determines what that identity may see, evaluate, approve or execute.
- **Tenant and account security** constrain the data entering the investigation.
- **Rules** determine whether a result is valid under current business policy.
- **Workflow** determines whether an action is valid at this point in the process and who may perform it.
- **Evidence and lineage** show how the result was produced and what it can prove.
- **BDD and integration testing** prove that these controls still work when the complete system is assembled.

No prompt can replace these boundaries. Telling a model to respect permissions is not access control. Asking it not to hallucinate is not evidence validation. Telling it to seek approval is not a workflow.

The model proposes. Deterministic code validates and executes.

## Illuminatio currently stops before command execution

The current Illuminatio AI is deliberately an investigator, not an autonomous operator.

It can discover authorised evidence, reconcile results, inspect rule provenance, read workflow state and recommend a solution. It does not receive general command-execution capabilities.

The narrow exception is what-if evaluation. The AI may select a separately registered rule-evaluation capability when the user asks a hypothetical question. The platform validates the capability, authority and permitted facts, then evaluates the rules in an isolated session.

The result carries a `DRY_RUN` marker, the deployed rule-source checksum, the fired-rule trace and the declared outputs. It must never be presented as evidence that production execution occurred.

This boundary is simple:

> **Illuminatio can investigate reality and simulate alternatives, but it cannot yet change reality.**

## A settlement investigation shows the complete pattern

Consider a user asking:

> **Why is this settlement on hold, and would correcting the amount release it?**

The model turns the request into a task contract and uses the graph to plan an investigation. It retrieves the authorised settlement instruction, follows the declared relationship to the treasury payment and checks whether charges explain the difference.

It then inspects the relevant rule provenance and requests a registered dry run using the hypothetical corrected amount. The rules engine performs the evaluation; the AI explains the returned outcome.

Finally, it reads the workflow case and identifies the active work item, current state and authority required for the next action.

The answer can now say that the current amount triggered a particular deployed rule, that the case is waiting for operations review, and that the corrected amount did not trigger the rule in a dry run. It can link the settlement evidence, rule trace and workflow item.

What it cannot say is that the settlement has been corrected or released. No production action has occurred.

## The next step is an AI generated solution workflow

The next stage for Illuminatio is not unrestricted command execution. It is for the AI to generate a proposed solution workflow from registered application capabilities.

For the settlement example, the AI might propose:

1. Correct the settlement amount.
2. Revalidate the instruction.
3. Regenerate the payment instruction.
4. Resubmit it to the settlement process.
5. Monitor the acknowledgement and final state.

The proposal is a structured workflow artifact, not an instruction to execute immediately. The platform validates every step, input, dependency, permission and outcome. The exact proposal is stored immutably with its evidence, capability versions, requested actor and idempotency key.

The user must then approve or reject it.

> **The AI proposes the workflow. The user authorises the effect.**

Approval enables a separate execution step, which rechecks tenant, current authority and workflow state before calling the real application use cases. Execution must be idempotent so a retry cannot apply the effect twice. Rejection records the actor, time, outcome and notes without changing the business state.

If four-eyes control is required, the maker cannot approve their own proposal. A different authorised checker must approve or reject it. The review itself does not perform the mutation; it enables a separately controlled execution step.

If the proposed workflow changes, it becomes a new version requiring fresh approval. The system must execute exactly what was approved, not ask the model to regenerate something similar afterward.

## BDD proves the guardrails are real

Rules and workflow can each be correct in isolation while the complete behaviour remains unsafe.

BDD and integration tests prove the assembled boundary: the authorised user can see the evidence; another tenant cannot; a what-if remains a dry run; a recommendation cannot bypass workflow; rejection has no business effect; approval executes the immutable proposal once; and a repeated request remains idempotent.

The model may choose different valid investigation paths as it improves. The invariants must not change.

This is why executable business specifications are so valuable for AI. They do not tell the model every path to take. They prove that every permitted path remains inside the same controls.

## Three levels of AI autonomy

The progression is now clear:

1. **Investigation** — the AI gathers and reconciles authorised evidence.
2. **Simulation** — the AI evaluates registered what-if alternatives without changing production state.
3. **Governed action** — the AI proposes a solution workflow that a user must approve or reject.

This is not autonomy without limits. It is increasing usefulness without surrendering authority.

## Conclusion

Enterprise AI is best understood as dynamic, goal-directed traversal of a graph of deterministic business capabilities.

The model chooses and revises the route. The platform ensures that every selected task is understood, supported, authenticated, authorised, bounded and auditable. Rules validate business policy. Workflow controls state and authority. BDD and integration testing prove that the boundaries hold.

Today, Illuminatio investigates and simulates. Tomorrow, it can generate proposed solution workflows. The final decision remains deliberately human: approve or reject.

That is how AI stays on the straight and narrow—not by removing its freedom to reason, but by ensuring that reasoning can only produce effects through deterministic, tested and authorised paths.

---

*Illuminatio is a Java and Spring-based post-trade platform I built to explore how AI changes both enterprise software development and the software delivered to business users.*

**Suggested Medium topics:** Artificial Intelligence, Enterprise Software, Software Architecture, Workflow, Financial Technology
