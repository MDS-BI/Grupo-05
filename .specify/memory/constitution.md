<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (Grupo 5, 2026-10-13)
- Added principles: V. Privacidad y sesgos de datos
- Previous change: Template → 1.0.0 (four principles: code quality, testing, UX consistency, performance)
- Added sections: Quality Standards, Development Workflow
- Removed sections: None
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# Constitución del Proyecto · Grupo 5 · Módulo de Ventas

## Core Principles

### I. Code Quality & Maintainability
All production code MUST be readable, modular, and consistent with the project's agreed style and architecture. Changes MUST prefer clear naming, small focused functions, and straightforward control flow over clever shortcuts. When abstractions are introduced, they MUST solve a clear need and be documented where the intent is non-obvious.

### II. Test-First & Verification
User-visible behavior and any change to business logic MUST be covered by automated tests before or alongside implementation. The default expectation is unit tests for logic, integration tests for workflow boundaries, and end-to-end coverage for critical user journeys. Features MUST NOT be considered complete until relevant tests pass and regressions are explicitly checked.

### III. User Experience Consistency
Product changes MUST preserve a consistent experience across screens, states, and interactions. Interfaces MUST follow established patterns for layout, terminology, feedback, loading states, empty states, validation, and error handling. Accessibility and clarity are mandatory; users MUST be able to understand, navigate, and recover from errors without ambiguity.

### IV. Performance & Reliability
Features MUST meet the performance budgets defined for the project and remain responsive under expected usage. Critical paths MUST avoid unnecessary round-trips, blocking work, and avoidable re-rendering or computation. When trade-offs are required, they MUST be justified with evidence from profiling, load expectations, or user impact.

### V. Privacidad y sesgos de datos
El módulo MUST tratar los datos de clientes según la Ley 19.628 (y la Ley 21.719 cuando entre en vigencia): solo se guardan los datos necesarios para vender, cobrar y despachar, y los datos de demostración MUST ser ficticios. La información sensible para el negocio (margen, costo) MUST mostrarse solo al perfil que la necesita. Las reglas automáticas que afectan a un cliente (crédito, descuentos) MUST basarse en su comportamiento comercial y nunca en atributos personales o de ubicación. El sistema MUST registrar también lo que no ocurrió (cotizaciones perdidas con su motivo) y las excepciones (aprobaciones de descuento con quién y cuándo), para que los indicadores no sufran sesgo de supervivencia ni oculten decisiones. Cada nueva funcionalidad MUST incluir en su plan una revisión de riesgos de datos y sesgos (ver `docs/riesgos-y-sesgos.md`).

## Quality Standards
The team MUST use linting, formatting, and static analysis tooling for the codebase, and unresolved warnings that affect correctness or maintainability MUST be addressed before release. Documentation MUST be updated when behavior, configuration, or public contracts change. Complex or risky changes MUST include a brief rationale in the implementation plan or pull request.

## Development Workflow
Every change MUST follow a small, reviewable increment with clear acceptance criteria, and each pull request MUST verify the relevant tests, quality checks, and user-facing behavior. Features that affect user experience or performance MUST include explicit validation steps in the plan and review notes. Work that introduces technical debt or exception handling MUST be documented so future contributors can reason about the trade-off.

## Governance
This constitution supersedes ad-hoc quality expectations for this project. Amendments require a documented rationale, updates to affected templates and plans, and review by the maintainers before adoption. Compliance is reviewed during planning, implementation review, and release readiness; deviations MUST be explicitly justified and tracked.

**Version**: 1.1.0 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-10-13
