# The Next AI Wave Is Inside the Application

## What building an AI investigator for enterprise finance taught me

The first big enterprise wave of AI happened in software development.

Codex, Claude Code, Cursor, Augment and similar tools moved quickly from clever code completion to something much more useful: give the agent a goal, a controlled workspace and a collection of tools, then let it plan, execute, inspect the result and try again.

The progress has been remarkable. But what about the people the software was built for?

For many business users, “AI inside the application” still means a chat window bolted onto the side of the screen. It can explain a field, summarise a document or produce a plausible paragraph. That is useful, but it is not the prize.

The prize is an AI that can do work inside the business process.

In enterprise finance, that means investigating why a settlement failed, reconciling a position, tracing an amount through trade capture, lifecycle, subledger, treasury and payment messaging, or identifying the small upstream data problem that eventually became a large downstream break.

That is what I set out to build in Illuminatio.

This is the next step after my earlier articles on [building enterprise financial software with AI](https://medium.com/@mjeremym/building-enterprise-financial-software-in-2026-fd3387635498), [stacking the deck in favour of AI-assisted development](https://medium.com/@mjeremym/building-enterprise-financial-software-in-2026-part-2-ca8c7eaafc93), and [using testing as the boundary layer](https://medium.com/@mjeremym/testing-was-the-unloved-child-ai-made-it-the-boundary-layer-11c124eb636b).

Those articles were about using AI to build the application. This one is about letting AI work inside it.

## Straight-through processing became a black box

Financial institutions have spent decades increasing straight-through processing. That was the right thing to do. Automation reduced manual work, improved throughput and removed many obvious operational errors.

It also created a different problem.

When everything works, the machinery is almost invisible. When the wheels fall off, the operator may be looking at the final symptom of a problem that started several services, messages and business days earlier.

A missing calendar update changes a value date. The changed date alters a lifecycle event. A payment misses a cut-off. A settlement remains pending. A position no longer reconciles. The first warning may have been buried in a log and dismissed as one of the many incidents that “normally do not matter”. Hours, days or months later, the bad data becomes a real issue.

I once encountered an interest discrepancy caused by the change of the Japanese Emperor and the resulting movement of a public holiday. I was not in Japan, I had not registered the change, and an upstream calendar had not been updated correctly.

The arithmetic was not difficult. Finding the cause was.

An AI with access to the relevant trade, cash-flow, calendar and processing evidence could have compared the dates, noticed the unusual business-day treatment and proposed the missing calendar as the next place to look. Not because it could magically predict the answer, but because it could investigate more paths, more quickly, than a person working through screens and logs one at a time.

This is where embedded AI becomes interesting. It can play detective.

## Do not build another chatbot

My first attempts were underwhelming.

The application already had a clean schema of reports and queries. It seemed reasonable to give the model those queries and ask it to chain them together. In theory, it should have understood a question, selected some data and returned an answer.

In practice, understanding the question was weak. Field names were technically correct but semantically thin. Too much context accumulated. The model could produce confident commentary without proving that it had found the right evidence. Giving AI data was easy. Giving it authority was much more difficult.

The mistake was treating the problem as chat.

Coding agents work well because a terminal is a closed system. The agent has a limited set of commands, visible input and output, explicit failures, files it may inspect and tests that define success. Most of the product is not the language model. It is the harness around it: tool discovery, permissions, context management, execution, observation, memory and the loop that continues until the goal is met.

An AI for post-trade operations needs the same shape.

The useful mental model is not “ChatGPT with access to the database”. It is a Codex for post-trade.

Its job is not to write a convincing answer in one pass. Its job is to understand the task, create a contract, build a plan, execute permitted tools, observe the evidence, revise the plan, validate the result and then report.

> **Intent → contract → plan → execute → observe → revise → validate → report**

That loop is the product.

The model's reasoning process is often described as Chain of Thought, or CoT. That is useful, but an enterprise implementation needs more than an internal chain of thought. It needs a controlled chain of work. Each thought that matters must become a typed intention, a permitted operation, an observable result or a recorded decision.

## The model plans; the application controls

There is an important division of responsibility.

The model should decide what the user is asking, what evidence is needed, which permitted queries to call, how the results relate, whether another step is required, and whether the answer is best shown as text, a table, a chart or a flow.

The application should decide what the model is allowed to see and do.

In Illuminatio, the model produces a structured task contract. The contract records the objective, subject domain, data needs, time scope, filters, acceptance criteria, expected artifacts, ambiguities and the proposed evidence path. A second structured contract describes the executable plan. The model can adapt a playbook, but a playbook is guidance, not proof.

Deterministic code validates that declaration against the live capabilities of the platform. It does not quietly invent a query, field, join or business decision when the model gets something wrong. If the required evidence is unavailable, the correct answer may be “inconclusive”, with the evidence gap made visible.

The boundary is simple:

- AI owns intent and planning.
- The platform owns capabilities, validation and execution.
- QueryBuilder and DataSet operations own filtering, joins and aggregation.
- Security owns identity, tenancy, roles and masking.
- The human owns authority-bearing decisions.

The probabilistic part is used where judgement is valuable. The deterministic parts remain deterministic.

## I can only see what you can see

You cannot solve financial data security by telling the model, “Please respect the user's permissions.”

The governing rule is:

> **I can only see what you can see.**

The AI runs as the user who requested the work. The model receives only data that user is entitled to access. The same identity and authority boundary is checked again when a query or operation is executed. Finding another path through the data does not grant the model wider access.

This was possible because security was built into the Illuminatio framework rather than added for AI. A system context carries the effective tenant, user and roles through a process. Every workflow case has a principal. Even work triggered by a backend event or scheduled process runs as an explicit system principal—the equivalent of `root` in Unix—rather than as an anonymous, unaccountable process.

The AI has no route to issue arbitrary SQL. Model-selected queries pass through the same read-only QueryBuilder and secured report repositories used by the application. Those repositories apply tenant, user and role rules before returning rows. Sensitive columns can be masked, and result sizes remain bounded.

This is especially important when the model is external. Personal or commercially sensitive data may not be allowed to leave the institution or jurisdiction. A local model may be appropriate in some deployments. In others, detailed operations can remain local while only the minimum authorised evidence is sent for planning or synthesis.

The AI must never become a new route around controls already present in the application.

## Reconciliation is the ideal first use case

There is plenty of excitement around using AI to predict markets. The potential profit is enormous, but so is the uncertainty. Would you bet the farm on a probabilistic answer?

Operational investigation offers a less glamorous but more credible route to return on investment.

Take a settlement amount mismatch. The investigation can:

1. Find the tenant-authorised settlement instruction.
2. Follow its external reference to the treasury payment.
3. Compare amount, currency, date and lifecycle status.
4. Inspect charges that could explain gross-versus-net differences.
5. Check SWIFT state for rejection or missing confirmation.
6. Inspect lifecycle actions for a blocked or stale trade version.
7. Check the relevant business calendar and FX context.
8. Compare the resulting postings and positions.
9. Stop when the answer contract is satisfied—or state exactly which evidence is missing.

The result is not merely a paragraph saying “there appears to be a mismatch”. It is a case with a visible evidence chain, source-linked tables, findings, confidence, gaps and a proposed next action.

Work that previously took hours of screen-hopping and spreadsheet comparison can move towards minutes. More importantly, the investigation becomes repeatable. The second operator does not have to rediscover the reasoning of the first.

The same harness can support failed settlements, position roll-forward freshness, cash breaks, missing postings, risk-run failures and operational help. The business process changes; the architecture remains largely the same.

## Keep the human in the authority loop

Knowledge work is harder to automate than it first appears—particularly to those of us in IT who look at a business process and think it seems straightforward.

Giving AI access to evidence is one thing. Allowing it to make decisions that move money, change books and records, approve an exception or release a payment is another.

Illuminatio separates recommendations from approval. The AI may identify a likely cause and recommend an operational action. If that action carries authority, it enters a workflow where a permitted person approves or rejects it. The approval, actor, time and comment become part of the decision record.

That is not a temporary weakness to be removed when models get bigger. It is good enterprise design.

Agents will automate repetitive parts of work, but the result should be to make the human role more interesting: less time gathering evidence and more time applying judgement, resolving ambiguity and improving the process.

## The real opportunity

The first wave showed that AI can help us build enterprise applications much faster.

The next wave is to use the same agentic ideas for the people operating those applications.

Not a chatbot that sits beside the business process. An investigator that works within it.

Not arbitrary access to a data lake. A graph of well-described, read-only capabilities.

Not an opaque answer. A visible chain of evidence and an honest statement of gaps.

Not autonomous authority. A recommendation that enters the same controlled workflow as any other material decision.

For enterprise finance, the safest initial value may not be predicting the market. It may be understanding the machinery we already have: finding breaks sooner, reconciling positions faster, explaining failures clearly and stopping small data problems from becoming large operational ones.

That is less spectacular than betting the farm.

It is also much more likely to pay back.

The companion article explains the framework beneath this approach: QueryBuilder, DataSets, relational algebra, semantic manifests and the bounded data terminal that turns model reasoning into safe, deterministic work.

---

*Illuminatio is a Java and Spring-based post-trade platform I built to explore how AI changes both enterprise software development and the software delivered to business users. I would also like to thank the many iterations with ChatGPT that helped turn the initial, underwhelming attempts into a working investigation architecture. It was a learning experience for both of us.*

**Suggested Medium topics:** Artificial Intelligence, Financial Technology, Enterprise Software, Operations, Agentic AI
