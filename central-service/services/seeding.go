package services

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
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
