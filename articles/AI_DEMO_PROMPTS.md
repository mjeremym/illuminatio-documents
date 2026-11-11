# Illuminatio AI Demo Prompts

This runbook contains copy-and-paste prompts for demonstrating the embedded AI capabilities in the local Illuminatio demo environment.

## Verified demo context

The prompts are tailored to the local full-platform showcase data as of **14 October 2026**. At the time this runbook was prepared, the environment contained:

- 506 trades through 14 October 2026
- 740 settlement payment instructions
- 2,086 treasury cash flows
- 66 cash ladders
- 895 current positions and 346 position snapshots
- 7 reconciliation breaks
- 10 completed risk runs
- 4 completed report runs

The dataset includes multi-product trading, settlement exceptions, allocations, charges, portfolio valuation and risk, reconciliation evidence, and generated reports.

## Recommended demonstration order

For a short presentation, use:

1. The control-room briefing to demonstrate multi-domain investigation.
2. The settlement exception prompt to demonstrate operational triage.
3. The end-to-end investigation to demonstrate evidence lineage.
4. The follow-up prompts to demonstrate conversational refinement.

## 1. Operations control-room briefing

This is the strongest all-round demonstration. It asks the AI to plan and execute a multi-domain investigation, choose evidence sources, aggregate results, prioritise exceptions, and produce tables and charts.

```text
Act as today's Operations Control lead.

For 14 October 2026, produce a concise control-room briefing covering:

1. Trading activity by product type, side and currency, including total notionals and the five largest trades.
2. Settlement instructions due on or before today, split by settlement status, matching status and currency.
3. Mismatched, unmatched or overdue settlement instructions that need attention, ranked by urgency and value.
4. Cash liquidity from 14 to 19 October, showing daily inflows, outflows and net movement by currency, separated into actual, confirmed and projected flows.
5. Open reconciliation breaks and their owners, dispositions and next-review dates.
6. Failed, retrying or incomplete scheduler, compute, risk and report activity.

Give me:
- an executive summary;
- a priority-ranked exception list;
- appropriate charts and evidence tables;
- drill-down references where available;
- the exact evidence used for every conclusion;
- a clear statement of any missing or unavailable evidence.

Do not invent explanations for missing data.
```

## 2. Settlement exception triage

This prompt demonstrates filtering, grouping, prioritisation and operational recommendations against a populated exception dataset.

```text
Investigate settlement risk as of 14 October 2026.

Find every payment instruction due on or before today that is not settled. Group the results by matching status, settlement status and currency. Rank the exceptions by urgency and amount.

For the most important items, show the instruction ID, trade ID, settlement date, amount, currency, matching status, settlement status, settlement system and failure reason. Explain why each item needs attention, but clearly distinguish evidence from inference.

Finish with a short Operations action plan and provide drill-down links where available.
```

## 3. End-to-end trade investigation

This prompt demonstrates cross-domain evidence tracing rather than a search against one table.

```text
Find the highest-value unsettled instruction due on or before 14 October 2026 and investigate it end to end.

Trace it from the settlement instruction back to the originating trade and, where evidence exists, forward to its treasury payment, cash flow and ledger activity.

Build a timeline showing:
- trade booking;
- settlement instruction creation;
- matching;
- treasury or cash-flow activity;
- current status.

Explain where processing stopped, what evidence supports that conclusion, and what information is unavailable. Include a compact evidence table with identifiers that can be opened in the relevant workbench.
```

## 4. Treasury liquidity outlook

This prompt demonstrates cash-flow aggregation, status-aware interpretation, chart selection and exception highlighting.

```text
Show the GBP, USD and EUR liquidity outlook from 14 to 19 October 2026.

Combine cash-ladder and cash-flow evidence. For each value date and currency, show inflows, outflows and net movement, separated into actual, confirmed and projected amounts.

Highlight:
- dates with the largest projected net outflow;
- confirmed payments that materially change the forecast;
- concentrations by account;
- any evidence gaps.

Present a chart followed by a detailed table and a concise Treasury commentary.
```

## 5. Reconciliation and control evidence

The current dataset contains resolved, monitored and waived breaks, making this suitable for demonstrating evidence-led control assessment.

```text
Explain the latest reconciliation run and whether its control outcome is defensible.

Show every associated break with its step, business key, status, owner, occurrence count, disposition reason, next-review date and evidence reference.

Separate the breaks into:
- resolved;
- monitoring;
- waived;
- still requiring action.

Explain the evidence supporting each disposition. Pay particular attention to waived or monitored exceptions and identify any missing approval or supporting evidence. End with a concise control-sign-off assessment.
```

## 6. Portfolio and risk briefing

This prompt uses the portfolio projections available through Datamart together with Risk evidence.

```text
Prepare an investment and risk briefing for portfolio account IL01/OACT-0108-~ as of 14 October 2026.

Use available position, valuation, strategy-allocation, risk and mandate evidence to explain:
- gross and net market value;
- the largest position and currency exposures;
- strategy weights compared with their lower, target and upper bounds;
- valuation exceptions or provisional prices;
- VaR, stress and sensitivity results;
- mandate status and any findings.

Use charts where helpful. For every conclusion, include its result-set, run or source-evidence reference. If a requested measure is unavailable, say so rather than estimating it.
```

## 7. AI service self-observability

The local data includes a failed AI knowledge-refresh scheduler run followed by a retry-pending run.

```text
Investigate the AI knowledge-refresh scheduler activity for 14 October 2026.

Explain:
- the failed run;
- its recorded error;
- the subsequent retry state;
- retry count and relevant timestamps;
- whether dependent jobs or services appear affected;
- whether an operator needs to intervene.

Present a short incident summary, an evidence timeline and recommended next actions. Clearly label recommendations separately from observed facts.
```

## Conversational follow-up sequence

Run these after the settlement exception prompt to demonstrate refinement and reuse of prior evidence.

### Follow-up 1: narrow the evidence

```text
Refine the previous result to show only mismatched instructions and overdue unmatched instructions. Keep the original evidence and do not rerun unrelated queries unless necessary.
```

### Follow-up 2: change the presentation

```text
Now group those exceptions by currency and settlement system, and show the value concentration as a chart.
```

### Follow-up 3: make an operational decision

```text
Choose the single exception an Operations analyst should investigate first. Explain the ranking criteria, trace its related evidence, and give me a checklist for resolving it.
```

## Demonstration guidance

- Prefer explicit dates such as `14 October 2026` because the demo environment may use a controlled business clock.
- Ask the AI to distinguish evidence, inference and recommendation.
- Request identifiers and drill-down references so the audience can move from the generated answer to the underlying workbench records.
- Ask the AI to state evidence gaps rather than silently estimating missing values.
- Use a focused prompt first if presentation time is limited; the control-room prompt exercises more capabilities but naturally takes longer.

## Current limitation

Avoid using **“Are all configured services running?”** as the headline demonstration without first checking the AI configuration. Although that prompt exists as an acceptance scenario, the `testdata` reporting capability is disabled by default in the current AI service configuration. The prompts above use enabled capabilities backed by populated local data.

## Relevant local sources

- Full-platform seed profile: `illuminatio-testdata/src/main/resources/profiles/full-platform-demo.yaml`
- AI capability configuration: `illuminatio-ai/src/main/resources/application.yml`
- AI acceptance prompts: `illuminatio-ai/src/main/resources/META-INF/illuminatio/ai-acceptance/reference-cases-v1.json`
- Domain report capability catalogues: `illuminatio-*/src/main/resources/META-INF/illuminatio/report-capabilities/*/catalog-v1.json`
