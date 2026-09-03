package services

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SeedingService struct {
	db *gorm.DB
}

func InitializeSeedingService(db *gorm.DB) SeedingService {
	return SeedingService{db}
}

func (service *SeedingService) SeedProblems(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open csv file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	header, err := reader.Read()
	if err != nil {
		return fmt.Errorf("failed to read csv header: %w", err)
	}

	index := make(map[string]int, len(header))
	for i, col := range header {
		index[strings.ToLower(strings.TrimSpace(col))] = i
	}

	titleIndex, ok := index["title"]
	if !ok {
		return fmt.Errorf("csv missing required column: Title")
	}

	slugIndex, ok := index["slug"]
	if !ok {
		return fmt.Errorf("csv missing required column: Slug")
	}

	tagsIndex, hasTags := index["tags"]
	difficultyIndex, hasDifficulty := index["difficulty"]
	paidIndex, hasPaid := index["paid only"]

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading CSV record: %v", err)
			continue
		}

		if len(record) <= max(titleIndex, slugIndex) {
			continue
		}

		title := record[titleIndex]
		slug := record[slugIndex]

		difficultyStr := ""
		if hasDifficulty && difficultyIndex < len(record) {
			difficultyStr = record[difficultyIndex]
		}

		tagsStr := ""
		if hasTags && tagsIndex < len(record) {
			tagsStr = record[tagsIndex]
		}

		var difficulty string
		switch strings.ToLower(difficultyStr) {
		case "easy":
			difficulty = constants.DIFFICULTY_EASY
		case "medium":
			difficulty = constants.DIFFICULTY_MEDIUM
		case "hard":
			difficulty = constants.DIFFICULTY_HARD
		default:
			difficulty = constants.DIFFICULTY_MEDIUM
		}

		isPaid := false
		if hasPaid && paidIndex < len(record) {
			isPaid = strings.ToLower(strings.TrimSpace(record[paidIndex])) == "true"
		}

		var parsedTags []string
		for _, tag := range strings.Split(tagsStr, ",") {
			trimmedTag := strings.TrimSpace(tag)
			if trimmedTag == "" {
				continue
			}
			parsedTags = append(parsedTags, trimmedTag)
		}

		problem := models.Problem{
			Name:       title,
			Slug:       slug,
			Tags:       parsedTags,
			Difficulty: difficulty,
			IsPaid:     isPaid,
		}

		// Upsert based on Slug
		if err := service.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "tags", "difficulty", "is_paid"}),
		}).Create(&problem).Error; err != nil {
			log.Printf("Failed to seed problem %s: %v", title, err)
		}
	}
	if err := service.RebuildTagStats(); err != nil {
		return fmt.Errorf("failed rebuilding tag stats: %w", err)
	}
	log.Println("seeding completed")
	return nil
}

// SeedCompanyProblems loads (slug, company) pairings produced by
// cmd/fetch-company-problems from https://github.com/liquidslr/leetcode-company-wise-problems
// into ProblemCompanyTag rows, matched to existing Problem rows by slug.
// Problems not already seeded via SeedProblems are skipped, since a company
// tag is meaningless without the problem it points to.
func (service *SeedingService) SeedCompanyProblems(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open csv file: %w", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	header, err := reader.Read()
	if err != nil {
		return fmt.Errorf("failed to read csv header: %w", err)
	}

	index := make(map[string]int, len(header))
	for i, col := range header {
		index[strings.ToLower(strings.TrimSpace(col))] = i
	}

	slugIndex, ok := index["slug"]
	if !ok {
		return fmt.Errorf("csv missing required column: Slug")
	}
	companyIndex, ok := index["company"]
	if !ok {
		return fmt.Errorf("csv missing required column: Company")
	}
	freqIndex, hasFreq := index["frequency"]
	windowsIndex, hasWindows := index["windows"]

	slugToID := make(map[string]uint)
	var problems []models.Problem
	if err := service.db.Select("id", "slug").Find(&problems).Error; err != nil {
		return fmt.Errorf("failed to load problems for company seeding: %w", err)
	}
	for _, problem := range problems {
		slugToID[problem.Slug] = problem.ID
	}

	skippedUnknownSlug := 0
	tags := make([]models.ProblemCompanyTag, 0, len(problems))
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading company CSV record: %v", err)
			continue
		}
		if len(record) <= max(slugIndex, companyIndex) {
			continue
		}

		slug := strings.TrimSpace(record[slugIndex])
		company := strings.TrimSpace(record[companyIndex])
		if slug == "" || company == "" {
			continue
		}

		problemID, ok := slugToID[slug]
		if !ok {
			skippedUnknownSlug++
			continue
		}

		var frequency float64
		if hasFreq && freqIndex < len(record) {
			frequency, _ = strconv.ParseFloat(strings.TrimSpace(record[freqIndex]), 64)
		}

		var windows []string
		if hasWindows && windowsIndex < len(record) {
			for _, w := range strings.Split(record[windowsIndex], ";") {
				trimmed := strings.TrimSpace(w)
				if trimmed != "" {
					windows = append(windows, trimmed)
				}
			}
		}

		tags = append(tags, models.ProblemCompanyTag{
			ProblemID: problemID,
			Company:   company,
			Frequency: frequency,
			Windows:   windows,
		})
	}

	if skippedUnknownSlug > 0 {
		log.Printf("Skipped %d company tag rows for slugs not present in seeded problems", skippedUnknownSlug)
	}

	// Upsert in batches keyed on (problem_id, company), same pattern as SeedProblems.
	const batchSize = 500
	for i := 0; i < len(tags); i += batchSize {
		end := min(i+batchSize, len(tags))
		batch := tags[i:end]
		if err := service.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "problem_id"}, {Name: "company"}},
			DoUpdates: clause.AssignmentColumns([]string{"frequency", "windows"}),
		}).Create(&batch).Error; err != nil {
			return fmt.Errorf("failed to upsert company tags batch: %w", err)
		}
	}

	if err := service.RebuildCompanyStats(); err != nil {
		return fmt.Errorf("failed rebuilding company stats: %w", err)
	}
	log.Printf("company seeding completed: %d pairs seeded", len(tags))
	return nil
}

func (service *SeedingService) RebuildCompanyStats() error {
	type companyCounter struct {
		total  int
		easy   int
		medium int
		hard   int
	}

	type row struct {
		Company    string
		Difficulty string
	}
	var rows []row
	if err := service.db.Model(&models.ProblemCompanyTag{}).
		Joins("JOIN problems ON problems.id = problem_company_tags.problem_id").
		Select("problem_company_tags.company AS company, problems.difficulty AS difficulty").
		Find(&rows).Error; err != nil {
		return err
	}

	statsMap := make(map[string]*companyCounter)
	for _, r := range rows {
		counter, ok := statsMap[r.Company]
		if !ok {
			counter = &companyCounter{}
			statsMap[r.Company] = counter
		}
		counter.total++
		switch r.Difficulty {
		case constants.DIFFICULTY_EASY:
			counter.easy++
		case constants.DIFFICULTY_MEDIUM:
			counter.medium++
		case constants.DIFFICULTY_HARD:
			counter.hard++
		}
	}

	if err := service.db.Where("1 = 1").Delete(&models.ProblemCompanyStat{}).Error; err != nil {
		return err
	}

	stats := make([]models.ProblemCompanyStat, 0, len(statsMap))
	for company, count := range statsMap {
		stats = append(stats, models.ProblemCompanyStat{
			Company:     company,
			TotalCount:  count.total,
			EasyCount:   count.easy,
			MediumCount: count.medium,
			HardCount:   count.hard,
		})
	}

	if len(stats) == 0 {
		return nil
	}

	return service.db.Create(&stats).Error
}

func (service *SeedingService) RebuildTagStats() error {
	type tagCounter struct {
		total  int
		easy   int
		medium int
		hard   int
	}

	var problems []models.Problem
	if err := service.db.Find(&problems).Error; err != nil {
		return err
	}

	statsMap := make(map[string]*tagCounter)
	for _, problem := range problems {
		seen := map[string]bool{}
		for _, rawTag := range problem.Tags {
			tag := strings.TrimSpace(rawTag)
			if tag == "" || seen[tag] {
				continue
			}
			seen[tag] = true

			counter, ok := statsMap[tag]
			if !ok {
				counter = &tagCounter{}
				statsMap[tag] = counter
			}

			counter.total++
			switch problem.Difficulty {
			case constants.DIFFICULTY_EASY:
				counter.easy++
			case constants.DIFFICULTY_MEDIUM:
				counter.medium++
			case constants.DIFFICULTY_HARD:
				counter.hard++
			}
		}
	}

	if err := service.db.Where("1 = 1").Delete(&models.ProblemTagStat{}).Error; err != nil {
		return err
	}

	stats := make([]models.ProblemTagStat, 0, len(statsMap))
	for tag, count := range statsMap {
		stats = append(stats, models.ProblemTagStat{
			Tag:         tag,
			TotalCount:  count.total,
			EasyCount:   count.easy,
			MediumCount: count.medium,
			HardCount:   count.hard,
		})
	}

	if len(stats) == 0 {
		return nil
	}

	return service.db.Create(&stats).Error
}
