package config

import (
	"os"
	"strconv"
)

// StatutoryRule is intentionally generic: rates can be updated by policy or
// organization configuration without changing payroll code.
type StatutoryRule struct {
	Enabled        bool    `json:"enabled"`
	EmployeeRate   float64 `json:"employeeRate"`
	EmployerRate   float64 `json:"employerRate"`
	FixedAmountINR int64   `json:"fixedAmountInr"`
}

type StatutoryConfig struct {
	PF              StatutoryRule `json:"pf"`
	ESI             StatutoryRule `json:"esi"`
	ProfessionalTax StatutoryRule `json:"professionalTax"`
	TDS             StatutoryRule `json:"tds"`
}

type Config struct {
	HTTPAddr       string          `json:"httpAddr"`
	Currency       string          `json:"currency"`
	Timezone       string          `json:"timezone"`
	StatutoryRules StatutoryConfig `json:"statutoryRules"`
}

func Load() Config {
	return Config{
		HTTPAddr: defaultString(os.Getenv("HTTP_ADDR"), ":8080"),
		Currency: "INR",
		Timezone: "Asia/Kolkata",
		StatutoryRules: StatutoryConfig{
			PF:              ruleFromEnv("PF"),
			ESI:             ruleFromEnv("ESI"),
			ProfessionalTax: ruleFromEnv("PROFESSIONAL_TAX"),
			TDS:             ruleFromEnv("TDS"),
		},
	}
}

func ruleFromEnv(prefix string) StatutoryRule {
	return StatutoryRule{
		Enabled:        os.Getenv(prefix+"_ENABLED") == "true",
		EmployeeRate:   floatFromEnv(prefix + "_EMPLOYEE_RATE"),
		EmployerRate:   floatFromEnv(prefix + "_EMPLOYER_RATE"),
		FixedAmountINR: int64FromEnv(prefix + "_FIXED_AMOUNT_INR"),
	}
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func floatFromEnv(key string) float64 {
	value, err := strconv.ParseFloat(os.Getenv(key), 64)
	if err != nil || value < 0 {
		return 0
	}
	return value
}

func int64FromEnv(key string) int64 {
	value, err := strconv.ParseInt(os.Getenv(key), 10, 64)
	if err != nil || value < 0 {
		return 0
	}
	return value
}
