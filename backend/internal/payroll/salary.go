package payroll

import "time"

const CurrencyINR = "INR"

var IndiaLocation = mustLoadLocation("Asia/Kolkata")

type SalaryStructure struct {
	Basic            int64 `json:"basic"`
	HRA              int64 `json:"hra"`
	SpecialAllowance int64 `json:"specialAllowance"`
	Conveyance       int64 `json:"conveyance"`
	OtherAllowance   int64 `json:"otherAllowance"`
}

func (s SalaryStructure) GrossMonthlyINR() int64 {
	return s.Basic + s.HRA + s.SpecialAllowance + s.Conveyance + s.OtherAllowance
}

func ProratedGrossINR(s SalaryStructure, joined, left *time.Time, year int, month time.Month) int64 {
	monthly := s.GrossMonthlyINR()
	days := daysInMonth(year, month)
	worked := days
	if joined != nil && joined.After(time.Date(year, month, 1, 0, 0, 0, 0, IndiaLocation)) {
		worked -= joined.Day() - 1
	}
	if left != nil && left.Before(time.Date(year, month, days, 0, 0, 0, 0, IndiaLocation)) {
		worked = left.Day()
	}
	if worked < 0 {
		worked = 0
	}
	if worked > days {
		worked = days
	}
	return monthly * int64(worked) / int64(days)
}

func daysInMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, IndiaLocation).Day()
}

func mustLoadLocation(name string) *time.Location {
	location, err := time.LoadLocation(name)
	if err != nil {
		panic(err)
	}
	return location
}
