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
	// skip header row
	if _, err := reader.Read(); err != nil {
		return fmt.Errorf("failed to read csv header: %w", err)
	}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading CSV record: %v", err)
			continue
		}

		if len(record) < 9 {
			continue
		}

		// columns: 0:ID, 1:Title, 2:URL, 3:Difficulty, 4:IsPremium, 5:?, 6:Slug, 7:Desc, 8:Hints
		title := record[1]
		difficultyStr := record[3]
		slug := record[6]
		description := record[7]
		hints := record[8]

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

		isPaid := strings.ToLower(record[4]) == "true"

		problem := models.Problem{
			Name:        title,
			Slug:        slug,
			Description: description,
			Hints:       hints,
			Difficulty:  difficulty,
			IsPaid:      isPaid,
		}

		// Upsert based on Slug
		if err := service.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "description", "hints", "difficulty"}),
		}).Create(&problem).Error; err != nil {
			log.Printf("Failed to seed problem %s: %v", title, err)
		}
	}
	log.Println("seeding completed")
	return nil
}
