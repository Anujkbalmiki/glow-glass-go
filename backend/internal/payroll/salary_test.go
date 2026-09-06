package payroll

import (
	"testing"
	"time"
)

func TestProratedGrossINRForMidMonthJoin(t *testing.T) {
	joined := time.Date(2026, time.June, 16, 0, 0, 0, 0, IndiaLocation)
	got := ProratedGrossINR(SalaryStructure{Basic: 30000, HRA: 10000}, &joined, nil, 2026, time.June)
	if got != 20000 {
		t.Fatalf("expected INR 20,000, got %d", got)
	}
}

func TestIndiaTimezone(t *testing.T) {
	if IndiaLocation.String() != "Asia/Kolkata" {
		t.Fatalf("unexpected timezone: %s", IndiaLocation)
	}
}
