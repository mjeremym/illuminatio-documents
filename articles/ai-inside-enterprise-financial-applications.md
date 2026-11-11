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

Coding agents work well because a terminal is a closed system. The agent has a limited set of commands, visible input and output, explicit failures, files it may inspect and tests that define success. Most of the product is not the language model. It is the harness around it: tool discovery, permissions, context management, execution, observation, checklists, memory and the loop that continues until the goal is met.

An AI for post-trade operations needs the same shape.

The useful mental model is not “ChatGPT with access to the database”. It is a Codex for post-trade.

Its job is not to write a convincing answer in one pass. Its job is to understand the task, create a contract, build a plan, execute permitted tools, observe the evidence, revise the plan, validate the result and then report.

> **Intent → contract → plan → execute → observe → revise → validate → report**

That loop is the product.

The model's reasoning process is often described as Chain of Thought, or CoT. That is useful, but an enterprise implementation needs more than an internal chain of thought. It needs a controlled chain of work: each thought that matters must become a typed intention, a permitted operation, an observable result or a recorded decision.

This is also one lesson from the success of agent runtimes such as OpenClaw. MCP can describe and connect tools, but a protocol alone is not an agent. The practical value comes from the runtime around the model: a constrained workspace, a small operational language, identity, permissions, memory, execution and a loop. A well-defined command-line interface can sometimes be more useful than a vast catalogue of loosely described tools because the syntax, behaviour and output are predictable.

## The model plans; the application controls

There is an important division of responsibility.

The model should decide what the user is asking, what evidence is needed, which permitted queries to call, how the results relate, whether another step is required, and whether the answer is best shown as text, a table, a chart or a flow.

The application should decide what the model is allowed to see and do.

In Illuminatio, the model produces a structured task contract. The contract records the objective, subject domain, data needs, time scope, filters, acceptance criteria, expected artifacts, ambiguities and the proposed evidence path. A second structured contract describes the executable plan. The model can adapt a playbook, but a playbook is guidance, not proof.

Deterministic code then validates that declaration against the live capabilities of the platform. It does not quietly invent a query, a field, a join or a business decision when the model gets something wrong. If the requested evidence is unavailable, the correct result may be “inconclusive”, with the evidence gap made visible.

That distinction matters. Hard-coding hundreds of keyword rules—“broken means this status”, “reconcile means that query”, “chart means this renderer”—would appear safe at first. It would also turn the AI into a brittle decision tree and move business meaning into scattered application code.

The better boundary is:

- AI owns intent and planning.
- The platform owns capabilities, validation and execution.
- SQL and ordinary code own arithmetic, filtering, joins and aggregation.
- Security owns identity, tenancy, roles and masking.
- The human owns authority-bearing decisions.

The probabilistic part is used where judgement is valuable. The deterministic parts remain deterministic.

## The AI layer stands on the application framework

It would be misleading to present this as an AI module that was simply connected to a collection of microservices.

The approach works because Illuminatio was already built as a well-defined framework. The modules share generic processes, typed identifiers, system context, security, QueryBuilder, workflow, reporting, audit, navigation and rendering conventions. A large amount of the platform is reusable framework code. A business module adds its specialisation on top rather than inventing a new way to execute every process.

Workflow is a good example. Illuminatio uses it extensively for cases, work items, transitions, approvals and operational state. An AI investigation is therefore not a special process running beside the application. It is another workflow-backed case using the same concepts as the rest of the platform. Recommendations that need authority become ordinary approval work rather than an AI-specific escape hatch.

Navigation follows the same principle. The AI does not invent a URL, tab name or table identifier. The modules publish structured navigation intents. The model can say where the user should go, or return the user to the exact workbench and filtered evidence behind an answer, but the renderer resolves that request through known application destinations.

This effectively gives the AI a terminal for Illuminatio: a limited, well-described syntax of queries, operations, workflows, artifacts and navigation intents. The more regular the framework is, the less the model must guess. The AI layer is comparatively thin because the application beneath it is coherent.

Two of the most important abstractions in that framework are QueryBuilder and DataSet.

QueryBuilder is not simply a convenient reporting API. It is the controlled route from a business request to data. It understands query metadata, typed criteria, ordering, projection, pagination, joins, unions and aggregation. It also sits above the secured report repositories. Wherever possible, Illuminatio pushes the work into the SQL QueryBuilders so the database performs set-based filtering, joining, grouping and calculation efficiently, close to the data and inside the security boundary.

The result of a query is a DataSet: a common, typed representation of columns, rows, metadata, paging and limitations. Because every module speaks this language, a result from settlement can be combined with a result from treasury, subledger, trade or calendar without teaching the AI a new data structure for every service.

The framework also provides deterministic in-memory dataset operations based on [relational algebra](https://en.wikipedia.org/wiki/Relational_algebra). Relational algebra uses [algebraic structures](https://en.wikipedia.org/wiki/Algebraic_structure) to model data and define queries with well-founded [semantics](<https://en.wikipedia.org/wiki/Semantics_(computer_science)>). In practical terms, datasets behave as relations and operations such as selection, projection, join and union produce new relations. The Illuminatio implementation extends that useful vocabulary with ordering, grouping and aggregations such as counts, sums and averages.

This theoretical foundation matters. The operations have defined meanings independent of the model that selected them. The AI does not improvise what a join or union means, and the result does not depend on persuasive natural language. A pipeline can execute the same declared relational operations in SQL, in memory, or as a hybrid. Heavy work should stay in SQL when the database can do it. In-memory relational algebra is valuable when authorised evidence has already been returned from different services or when the AI needs to transform previous artifacts into a new result.

This gives the model a safe way to create new datasets. The AI declares an input dataset, an output dataset and the required operations. The framework validates the declaration and performs the actual join, union, filter, grouping or aggregation. The output becomes another typed, traceable artifact that can be inspected, charted, reused in a follow-up or supplied as evidence to the next reasoning step.

For example, the model may request settlement instructions and treasury payments, join them by external reference, group them by account and currency, aggregate expected and actual amounts, and filter the result to non-zero differences. The model decides that this is the evidence it needs. QueryBuilder and the DataSet framework do the work.

## Data is not enough; the AI needs meaning

An LLM is only as useful as the information it can access. In this context, “access” is at least as important as “information”. The model has not been trained on the institution's current trades, positions or exceptions. Even if it had, training data would not tell it what a particular user is authorised to see now.

There is another problem. A JSON result set full of strings is data, but it is not necessarily information. `amount` might mean gross amount, net amount, settlement amount, booked amount, settled amount, tax, fee, FX difference or rounding. `date` is even worse.

The application therefore needs a semantic layer.

It also needs a corpus of prior engineering knowledge on which the AI can call back. The framework already expresses a great deal through code, schemas, QueryBuilder definitions, workflows, tests and navigation. The semantic layer makes that existing body of work legible to the model rather than replacing it with a second, disconnected knowledge system.

In Illuminatio, each business module publishes an AI-readable QueryBuilder semantic manifest. The manifest describes:

- what a query is for and what one row represents;
- its parameters, types, permitted operators and bounded values;
- its output columns and their business roles;
- safe aggregation rules and units;
- sensitivity and masking guidance;
- joins, comparisons and process-flow relationships;
- whether the evidence is direct proof, supporting evidence or explicitly not proof of a claim;
- where the user can navigate to inspect the source.

For example, the settlement module declares that a payment instruction can be joined to a treasury payment by an external reference. It also declares that the amounts, currencies, settlement dates and statuses can be compared, and that charges, SWIFT messages, lifecycle actions, market rates and calendars may explain a difference.

The calendar module describes holidays, business centres, event dates, time zones and sources. The subledger describes transactions, signed postings, position buckets and roll state. These are not just database fields. They are business concepts and relationships.

The AI service compiles the manifests published by the modules into a versioned query graph. The graph gives the model a map it can traverse without granting arbitrary database access.

This borrows from lessons the Web solved long ago. A resource has an identity. Terms can point to shared meanings. Small graph fragments can join into a larger graph. Standards such as [RDF](https://www.w3.org/TR/rdf11-concepts/), [RDF Schema](https://www.w3.org/TR/rdf-schema/), [OWL](https://www.w3.org/TR/owl2-overview/) and [JSON-LD](https://www.w3.org/TR/json-ld11/) provide a mature vocabulary for making data self-describing and interoperable.

There was no reason to invent all of this again. The pragmatic approach was to make do and mend: reuse the corpus of Web standards, apply only the pieces the application needs, and connect them to the framework already in place.

I would not begin by building a grand enterprise ontology. The useful route is incremental: give important fields stable semantic identities, add aliases and descriptions, declare relationships, state aggregation and masking rules, and record what a query can and cannot prove. The graph can grow as the application grows.

## Why I did not start with a vector database

RAG and vector databases are often proposed as the default answer to enterprise AI. They are valuable when the evidence is primarily unstructured text: contracts, policies, emails, procedures, research or documentation.

Most post-trade evidence is not like that.

A trade, settlement instruction, cash flow, posting or position is highly structured. The user normally needs exact filtering, joining, grouping, comparison and arithmetic. Storing every trade as an embedding and asking for the most semantically similar ones would be an expensive way to avoid the database engine that already knows how to answer the question precisely.

For structured financial data, deterministic retrieval should come first:

- QueryBuilder or an equivalent bounded, security-aware query abstraction;
- GraphQL or another typed discovery and execution contract;
- security-aware repositories for database access and exact calculations;
- a semantic graph for relationships and evidence selection;
- a canonical dataset model with SQL, in-memory and hybrid operations;
- structured artifacts that can be reused without repeatedly sending raw rows to the model.

The AI has no route to issue arbitrary SQL. A model-selected query passes through the same read-only QueryBuilder and report-repository layer used by the application. That layer applies the tenant, user and role security rules before returning rows. The database remains behind the repository boundary.

Vector search still has a place. Illuminatio has a knowledge index for glossary entries, processes, playbooks, examples and other descriptive material. But vectors assist discovery; they do not replace exact business queries, and similarity does not become proof.

That separation also controls cost. Do not send ten thousand cash flows to an LLM and ask it to add them up. Ask the model to declare the grouping and measure. The AI performs the instruction; QueryBuilder or the in-memory DataSet engine performs the operation and returns the compact result as evidence.

This is also how people work. We choose the calculation; the machine performs it.

## Context must be treated as working memory

Early versions accumulated too much context. Every result, explanation and intermediate decision made the next model call larger and less focused. Redundant material diluted the important evidence.

Good agent harnesses manage context as a scarce resource. Embedded AI must do the same.

The investigation should preserve structured artifacts, not an ever-growing transcript. A table, chart, plan, evidence set or prior result can be stored with its source query, filters, lineage and display metadata. A follow-up such as “show me only the breaks” should refine the existing artifact when possible, not rerun the whole investigation or paste all of the original data back into the prompt.

The system should retain an auditable trace of what matters: the declared plan, selected queries, rejected candidates, processed results, extracted facts, stop decisions, confidence, evidence gaps and recommendations. The model may use Chain of Thought to reason, but the application exposes the resulting chain of evidence rather than private raw reasoning. Users need to see what the system intended, what it did, what it found and why it stopped.

This makes the output both more useful and more defensible.

## Security is the data boundary, not a sentence in a prompt

You cannot solve financial data security by telling the model, “Please respect the user's permissions.”

The governing rule is simple:

> **I can only see what you can see.**

The AI runs as the user who requested the work. The model must only receive data that user is already entitled to access. The same identity and authority boundary is checked again when a query or operation is executed. The model cannot gain wider access merely because it found a different path through the query graph.

This was possible because security was built into the Illuminatio framework rather than added for AI. A system context carries the effective tenant, user and roles through a process. Every workflow case has a principal. Even work triggered by a backend event or scheduled process runs as an explicit system principal—the equivalent of `root` in Unix—rather than as an anonymous, unaccountable process.

Illuminatio requires a tenant in the request and verifies it against the authenticated tenant in the token. Roles control who may create, run, read or approve an investigation. The underlying report queries remain secured and tenant-scoped. Repository-level access rules include the effective user and role principals. Semantic column metadata can identify account information, operational notes and other fields that require masking.

This is especially important when the model is external. Personal or commercially sensitive data may not be allowed to leave the institution or jurisdiction. A local model may be appropriate in some deployments. In others, the best pattern is to keep detailed operations local and send only the minimum authorised, bounded evidence required for planning or synthesis.

The AI should never become a new route around the controls already present in the application.

## Keep the model choice open

As with the rest of Illuminatio, the mantra is to remain open.

The application should not be designed around the special behaviour of one model vendor. The AI integration is built around a portable provider boundary, following the approach of [Spring AI's model abstractions](https://docs.spring.io/spring-ai/reference/api/chatmodel.html). The current implementation includes an OpenAI-compatible adapter, while the boundary allows deployments to select locally hosted models or providers such as OpenAI and Anthropic as those adapters are configured. Model choice can therefore follow data-residency, confidentiality, cost and capability requirements rather than application design.

The contracts, capabilities, security boundaries, workflows and evidence artifacts belong to Illuminatio. The model is a replaceable reasoning component behind that boundary.

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

## Most of an enterprise AI agent is not AI

The final lesson is the same one I learned from AI coding tools.

The model is the visible, exciting component. Most of the working system is ordinary engineering:

- schemas and typed contracts;
- capability discovery;
- semantic metadata;
- SQL QueryBuilders and secured query execution;
- typed datasets and deterministic dataset algebra;
- SQL, in-memory and hybrid execution strategies;
- tenant, user and role propagation;
- security-aware report repositories;
- masking and bounded result sets;
- generic workflow and approval processes;
- structured navigation intents;
- artifact persistence and lineage;
- loops, limits, stop conditions and timeouts;
- workflow decision and audit records;
- a configurable model-provider boundary;
- deterministic tests and known data;
- generic table, chart, text and flow rendering.

That is harness engineering and loop engineering. The outcome does not come from one perfect prompt or from stuffing everything into an enormous context window. It comes from a system that can try a bounded step, observe the result, decide whether the goal has been met and continue safely when it has not.

Better models will improve the experience, but they will not remove the need for better data, better meaning and better boundaries.

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

---

*Illuminatio is a Java and Spring-based post-trade platform I built to explore how AI changes both enterprise software development and the software delivered to business users. I would also like to thank the many iterations with ChatGPT that helped turn the initial, underwhelming attempts into a working investigation architecture. It was a learning experience for both of us.*

**Suggested Medium topics:** Artificial Intelligence, Financial Technology, Enterprise Software, Software Architecture, Knowledge Graphs
