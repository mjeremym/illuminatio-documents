# Building a Safe Data Terminal for Enterprise AI

## QueryBuilder, DataSets and the framework behind an AI investigator

In the companion article, *The Next AI Wave Is Inside the Application*, I argued that the useful future of AI in enterprise finance is not another chatbot. It is an investigator that can work inside the business process: gather evidence, reconcile data, explain failures and recommend the next action.

That raises the more difficult question: how do you let a probabilistic model work inside a financial application without giving it arbitrary access to data or allowing it to invent the process?

The answer from Illuminatio was to give the AI something resembling a terminal.

Not a Unix terminal and not a general SQL prompt. A bounded operational language made from the framework the application already used: QueryBuilders, DataSets, workflow cases, semantic capabilities, navigation intents, artifacts, security context and approval processes.

The model decides what work is required. The framework validates and performs that work.

## The AI layer stands on the application framework

It would be misleading to present the Illuminatio AI service as a clever module connected to a collection of microservices.

The approach works because Illuminatio was already built as a coherent framework. Its modules share generic processes, typed identifiers, system context, security, QueryBuilder, workflow, reporting, audit, navigation and rendering conventions. A large proportion of the platform is reusable framework code. A business module adds its specialisation on top rather than inventing a new way to execute every process.

Workflow is one example. Illuminatio uses it extensively for cases, work items, transitions, approvals and operational state. An AI investigation is therefore not a special process running beside the application. It is another workflow-backed case using the same concepts as the rest of the platform. A recommendation that requires authority becomes ordinary approval work rather than an AI-specific escape hatch.

Navigation follows the same principle. The AI does not invent a URL, tab name or table identifier. Modules publish structured navigation intents. The model can say where the user should go, or return the user to the exact workbench and filtered evidence behind an answer, while the renderer resolves that request through known application destinations.

This effectively gives the AI a terminal for Illuminatio: a limited, well-described syntax of queries, dataset operations, workflows, artifacts and navigation intents. The more regular the framework, the less the model must guess.

This is also a lesson from agent runtimes such as OpenClaw. MCP can describe and connect tools, but a protocol alone is not an agent. The practical value comes from the harness around the model: a constrained workspace, an operational language, identity, permissions, memory, execution and a loop. A well-defined command-line interface can sometimes be more useful than a vast catalogue of loosely described tools because its syntax, behaviour and output are predictable.

## QueryBuilder is the controlled route to data

QueryBuilder is not simply a convenient reporting API. It is the controlled route from a business request to data.

Each QueryBuilder describes its columns, accepted criteria, types, ordering, pagination and other query behaviour. The report layer knows how to turn those declarations into SQL, while secured repositories apply tenant, user and role restrictions.

Wherever possible, Illuminatio pushes the work into SQL QueryBuilders. Databases are very good at set-based filtering, joining, grouping and calculation. Moving large volumes of data to an LLM would be slower, less exact and much more expensive. Moving them unnecessarily into application memory would also throw away the database engine's strengths.

The AI never receives a general SQL tool. It selects a known, read-only capability and declares the required filters or operations. The framework validates the field names, operators, values and limits before the QueryBuilder reaches the repository. Security predicates remain part of query execution.

This provides an important safety property. The model can explore the available business data, but it cannot create a novel path around the repository boundary.

## DataSet gives every module a common language

The result of a query is a DataSet: a common, typed representation of columns, rows, metadata, paging and limitations.

Because every module speaks this language, a settlement result can be combined with a treasury, subledger, trade or calendar result without teaching the AI a new data structure for every service.

That common representation is more important than it may first appear. An agentic investigation rarely ends with one query. It may need to compare two sources, join a reference from one to an identifier in another, group activity by account and currency, calculate an expected value and keep only the exceptions.

The model should decide that those operations are needed. It should not perform the calculations itself.

In Illuminatio, an executable plan can name an input dataset, an output dataset and the dataset operations required between them. The framework validates the declaration, executes the operations and produces a new typed dataset. That derived dataset becomes a traceable artifact that can be inspected, charted, reused in a follow-up or supplied as evidence to the next reasoning step.

## In-memory operations are relational algebra

The deterministic in-memory dataset layer is based on [relational algebra](https://en.wikipedia.org/wiki/Relational_algebra). Relational algebra uses [algebraic structures](https://en.wikipedia.org/wiki/Algebraic_structure) to model data and define queries with well-founded [semantics](<https://en.wikipedia.org/wiki/Semantics_(computer_science)>).

In practical terms, datasets behave as relations. Operations such as selection, projection, join and union produce new relations. Illuminatio extends that useful vocabulary with ordering, grouping and aggregations such as counts, sums and averages.

This theoretical foundation matters because the operations have meanings independent of the model that selected them. The AI does not improvise what a join or union means, and the answer does not depend on persuasive natural language.

A pipeline can execute in three ways:

- **SQL**, when the database can execute the complete pipeline efficiently.
- **In memory**, when authorised datasets have already been retrieved and can be transformed locally.
- **Hybrid**, when part of the work belongs in SQL and the remainder combines or transforms returned datasets.

The principle is to push the work down into SQL where practical, then use in-memory relational algebra where the evidence crosses services or builds on prior artifacts.

For example, the model may request settlement instructions and treasury payments, join them by external reference, group them by account and currency, aggregate expected and actual amounts, and filter the output to non-zero differences.

The model decides that this is the evidence it needs. QueryBuilder and the DataSet framework do the work.

> **The AI performs the instruction; deterministic code performs the operation.**

## Data is not enough; the AI needs meaning

A common data shape solves execution, but not understanding.

A JSON or DataSet column called `amount` might mean gross amount, net amount, settlement amount, booked amount, settled amount, tax, fee, FX difference or rounding. A column called `date` is even worse.

The application therefore needs a semantic layer. It also needs a corpus of prior engineering knowledge on which the AI can call back. Illuminatio already expresses a great deal through code, schemas, QueryBuilder definitions, workflows, tests and navigation. The semantic layer makes that existing body of work legible to the model rather than replacing it with a disconnected knowledge system.

Each business module publishes an AI-readable QueryBuilder semantic manifest describing:

- what a query is for and what one row represents;
- parameters, types, permitted operators and bounded values;
- output columns and their business roles;
- safe aggregation rules and units;
- sensitivity and masking guidance;
- joins, comparisons and process-flow relationships;
- whether evidence is direct proof, supporting evidence or explicitly not proof of a claim;
- where the user can navigate to inspect the source.

For example, the settlement module declares that a payment instruction can join to a treasury payment by external reference. It declares that amount, currency, settlement date and status can be compared, and that charges, SWIFT messages, lifecycle actions, market rates and calendars may explain a difference.

The calendar module describes holidays, business centres, event dates, time zones and sources. The subledger describes transactions, signed postings, position buckets and roll state. These are not just database fields. They are business concepts and relationships.

The AI service compiles the manifests into a versioned query graph. The graph gives the model a map it can traverse without granting arbitrary database access.

## Lessons borrowed from the Web

The Web solved many of these meaning and interoperability problems long ago. A resource has an identity. Terms can point to shared meanings. Small graph fragments can join into a larger graph.

Standards such as [RDF](https://www.w3.org/TR/rdf11-concepts/), [RDF Schema](https://www.w3.org/TR/rdf-schema/), [OWL](https://www.w3.org/TR/owl2-overview/) and [JSON-LD](https://www.w3.org/TR/json-ld11/) provide a mature vocabulary for making data self-describing and interoperable.

There was no reason to invent all of this again. The pragmatic approach was to make do and mend: reuse the corpus of Web standards, apply only the parts the application needs, and connect them to the framework already in place.

I would not begin by building a grand enterprise ontology. The useful route is incremental: give important fields stable semantic identities, add aliases and descriptions, declare relationships, state aggregation and masking rules, and record what a query can and cannot prove. The graph can grow as the application grows.

## Why I did not start with a vector database

RAG and vector databases are often proposed as the default answer to enterprise AI. They are valuable when the evidence is primarily unstructured text: contracts, policies, emails, procedures, research or documentation.

Most post-trade evidence is not like that.

A trade, settlement instruction, cash flow, posting or position is highly structured. The user normally needs exact filtering, joining, grouping, comparison and arithmetic. Storing every trade as an embedding and asking for the most semantically similar ones would be an expensive way to avoid the database and DataSet engines that already know how to answer precisely.

For structured financial data, deterministic retrieval should come first:

- bounded, security-aware QueryBuilders;
- typed discovery and execution contracts;
- secured repositories for database access;
- a canonical DataSet model;
- SQL, in-memory and hybrid relational operations;
- a semantic graph for evidence selection;
- reusable artifacts with source lineage.

Vector search still has a place. Illuminatio has a knowledge index for glossary entries, processes, playbooks, examples and descriptive material. Vectors assist discovery; they do not replace exact business queries, and similarity does not become proof.

Do not send ten thousand cash flows to an LLM and ask it to add them up. Ask the model to declare the grouping and measure. QueryBuilder or the in-memory DataSet engine performs the operation and returns the compact result as evidence.

## Context is working memory, not a dumping ground

Early versions accumulated too much context. Every result, explanation and intermediate decision made the next model call larger and less focused. Redundant material diluted the important evidence.

Good agent harnesses manage context as a scarce resource. Embedded AI must do the same.

The investigation preserves structured artifacts rather than an ever-growing transcript. A table, chart, plan, evidence set or prior result is stored with its source query, filters, lineage and display metadata. A follow-up such as “show me only the breaks” can refine the existing artifact when possible instead of rerunning the investigation or sending every raw row back to the model.

The system retains an auditable trace of what matters: the declared plan, selected queries, rejected candidates, processed results, extracted facts, stop decisions, confidence, evidence gaps and recommendations. The model may use Chain of Thought to reason, but the application exposes the resulting chain of evidence rather than private raw reasoning.

Users need to see what the system intended, what it did, what it found and why it stopped.

## Security belongs below the AI

The governing rule is simple:

> **I can only see what you can see.**

The AI runs as the requesting user. A system context carries the effective tenant, user and roles through the process. Even backend and scheduled work runs as an explicit system principal—the equivalent of `root` in Unix—rather than anonymously.

Security is enforced when capabilities are exposed, when queries execute and when artifacts are returned. The model cannot grant itself access by selecting a new query-graph path. It never receives arbitrary SQL, and it cannot bypass repository-level access controls.

The security model is part of the application framework. AI inherits it.

## Keep the model choice open

As with the rest of Illuminatio, the mantra is to remain open.

The application should not depend on the special behaviour of one model vendor. The integration uses a portable provider boundary, following the approach of [Spring AI's model abstractions](https://docs.spring.io/spring-ai/reference/api/chatmodel.html). The current implementation includes an OpenAI-compatible adapter, while the boundary allows locally hosted models or providers such as OpenAI and Anthropic as adapters are configured.

Model choice can therefore follow data residency, confidentiality, cost and capability requirements. The contracts, capabilities, security boundaries, workflows and evidence artifacts belong to Illuminatio. The model is a replaceable reasoning component.

## Most of the AI agent is not AI

The model is the visible component. Most of the working system is ordinary engineering:

- schemas and typed contracts;
- capability discovery and semantic metadata;
- SQL QueryBuilders and secured repositories;
- typed datasets and deterministic relational algebra;
- SQL, in-memory and hybrid execution;
- tenant, user and role propagation;
- masking and bounded results;
- generic workflow and approval processes;
- structured navigation intents;
- artifact persistence and lineage;
- loops, limits, stop conditions and timeouts;
- decision and audit records;
- configurable model providers;
- deterministic tests and known data;
- generic table, chart, text and flow rendering.

That is harness engineering and loop engineering. The outcome does not come from one perfect prompt or from stuffing everything into an enormous context window. It comes from a system that can try a bounded step, observe the result, decide whether the goal has been met and continue safely when it has not.

Better models will improve the experience, but they will not remove the need for better data, better meaning and better boundaries.

## Conclusion

An enterprise AI agent needs more than tools. It needs a well-defined world in which those tools have stable meanings, security is inherited from the user, operations are deterministic and every derived result has lineage.

That is what the Illuminatio framework provides.

QueryBuilder moves the work to secured SQL. DataSet provides a common language across modules. Relational algebra creates new evidence deterministically. Semantic manifests tell the model what the evidence means. Workflow and navigation connect the result back to the application.

The AI chooses the path. The framework keeps it on the road.

---

*Illuminatio is a Java and Spring-based post-trade platform I built to explore how AI changes both enterprise software development and the software delivered to business users.*

**Suggested Medium topics:** Artificial Intelligence, Software Architecture, Financial Technology, Relational Algebra, Knowledge Graphs
