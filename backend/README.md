# Go payroll API

This service is the backend foundation for the QPayslip MVP.

- Currency is deliberately INR-only for the MVP. The current salary preview uses whole INR values; persistence can move to integer paise before payment-grade calculations are introduced.
- All business dates use `Asia/Kolkata` (IST). Do not use the machine's local timezone.
- Indian salary examples are modeled as configurable components: Basic, HRA, Special Allowance, Conveyance, and Other Allowance.
- PF, ESI, Professional Tax, and TDS are optional configuration. They default to disabled and are not hardcoded into payroll calculations.

## Run

```sh
go test ./...
go run ./cmd/api
```

Endpoints: `GET /healthz` and `GET /api/v1/config`.

Environment variables for statutory configuration follow this pattern: `PF_ENABLED=true`, `PF_EMPLOYEE_RATE=0.12`, `PF_EMPLOYER_RATE=0.12`, and `PF_FIXED_AMOUNT_INR=0`. The equivalent prefixes are `ESI`, `PROFESSIONAL_TAX`, and `TDS`.
