package services

import (
	"fmt"
	"strings"

	"github.com/acmutd/bsg/central-service/constants"
	"github.com/acmutd/bsg/central-service/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// recentlyAskedWindows are the ProblemCompanyTag.Windows values that count as "recently
// asked" (asked within the last 6 months) - excludes rows that are only tagged
// MoreThanSixMonths/All.
var recentlyAskedWindows = []string{"ThirtyDays", "ThreeMonths", "SixMonths"}

type ProblemService struct {
	db *gorm.DB
}

type DifficultyParameter struct {
	NumEasyProblems   int
	NumMediumProblems int
	NumHardProblems   int
	Tags              []string
	Companies         []string
	Blind75           bool
	NeetCode150       bool
	RecentlyAsked     bool
}

func InitializeProblemService(db *gorm.DB) ProblemService {
	return ProblemService{db}
}

func (service *ProblemService) CreateProblem(problemData *models.Problem) (*models.Problem, error) {
	newProblem := models.Problem{
		Name:       problemData.Name,
		Slug:       problemData.Slug,
		Tags:       problemData.Tags,
		Difficulty: problemData.Difficulty,
		IsPaid:     problemData.IsPaid,
	}
	result := service.db.Create(&newProblem)
	if result.Error != nil {
		return nil, result.Error
	}
	return &newProblem, nil
}

// Function to find problem by id
func (service *ProblemService) FindProblemByProblemID(problemId uint) (*models.Problem, error) {
	var problem models.Problem
	searchResult := service.db.Where("ID = ?", problemId).Limit(1).Find(&problem)
	if searchResult.Error != nil {
		return nil, searchResult.Error
	}
	if searchResult.RowsAffected == 0 {
		return nil, nil
	}
	return &problem, nil
}

// Function to update problem with specified id
func (service *ProblemService) UpdateProblemData(problemId uint, problemData *models.Problem) (*models.Problem, error) {
	searchResult, err := service.FindProblemByProblemID(problemId)
	if err != nil {
		return nil, err
	}
	if searchResult == nil {
		return nil, gorm.ErrRecordNotFound
	}
	updateResult := service.db.Model(searchResult).Updates(problemData)
	if updateResult.Error != nil {
		return nil, updateResult.Error
	}
	return searchResult, nil
}

func (service *ProblemService) FindProblems(count uint, offset uint, tags []string, companies []string, blind75 bool, neetCode150 bool, recentlyAsked bool) ([]models.Problem, error) {
	var problems []models.Problem
	count = min(count, 100) // count should not exceed 100
	query := service.db.Limit(int(count)).Offset(int(offset))

	normalizedTags := normalizeTags(tags)
	if len(normalizedTags) > 0 {
		orParts := make([]string, 0, len(normalizedTags))
		orArgs := make([]interface{}, 0, len(normalizedTags))
		for _, tag := range normalizedTags {
			orParts = append(orParts, "LOWER(tags) LIKE ?")
			orArgs = append(orArgs, "%\""+strings.ToLower(escapeLikePattern(tag))+"\"%")
		}
		query = query.Where("("+strings.Join(orParts, " OR ")+")", orArgs...)
	}
	normalizedCompanies := normalizeTags(companies)
	query = applyCompanyFilters(query, normalizedCompanies)
	query = applyProblemListFilters(query, blind75, neetCode150)
	query = applyRecentlyAskedFilter(query, recentlyAsked, normalizedCompanies)

	searchResult := query.Find(&problems)
	if searchResult.Error != nil {
		return nil, searchResult.Error
	}
	return problems, nil
}

func normalizeTags(tags []string) []string {
	normalizedTags := make([]string, 0, len(tags))
	for _, tag := range tags {
		trimmedTag := strings.TrimSpace(tag)
		if trimmedTag == "" {
			continue
		}
		normalizedTags = append(normalizedTags, trimmedTag)
	}
	return normalizedTags
}

func escapeLikePattern(pattern string) string {
	replacer := strings.NewReplacer(`\\`, `\\\\`, `%`, `\\%`, `_`, `\\_`)
	return replacer.Replace(pattern)
}

func (service *ProblemService) GenerateProblemsetByDifficultyParameters(params DifficultyParameter) ([]models.Problem, bool, error) {
	var problems, easyProblems, mediumProblems, hardProblems []models.Problem
	normalizedTags := normalizeTags(params.Tags)
	normalizedCompanies := normalizeTags(params.Companies)
	requestedTotal := params.NumEasyProblems + params.NumMediumProblems + params.NumHardProblems
	fallbackUsed := false

	err := service.db.Transaction(func(tx *gorm.DB) error {
		easyQuery := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_EASY, false)
		easyQuery = applyTagFilters(easyQuery, normalizedTags)
		easyQuery = applyCompanyFilters(easyQuery, normalizedCompanies)
		easyQuery = applyProblemListFilters(easyQuery, params.Blind75, params.NeetCode150)
		easyQuery = applyRecentlyAskedFilter(easyQuery, params.RecentlyAsked, normalizedCompanies)
		if err := easyQuery.Limit(params.NumEasyProblems).Find(&easyProblems).Error; err != nil {
			return err
		}

		mediumQuery := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_MEDIUM, false)
		mediumQuery = applyTagFilters(mediumQuery, normalizedTags)
		mediumQuery = applyCompanyFilters(mediumQuery, normalizedCompanies)
		mediumQuery = applyProblemListFilters(mediumQuery, params.Blind75, params.NeetCode150)
		mediumQuery = applyRecentlyAskedFilter(mediumQuery, params.RecentlyAsked, normalizedCompanies)
		if err := mediumQuery.Limit(params.NumMediumProblems).Find(&mediumProblems).Error; err != nil {
			return err
		}

		hardQuery := tx.Clauses(clause.OrderBy{
			Expression: clause.Expr{
				SQL: "RANDOM()",
			},
		}).Where("difficulty = ? AND is_paid = ?", constants.DIFFICULTY_HARD, false)
		hardQuery = applyTagFilters(hardQuery, normalizedTags)
		hardQuery = applyCompanyFilters(hardQuery, normalizedCompanies)
		hardQuery = applyProblemListFilters(hardQuery, params.Blind75, params.NeetCode150)
		hardQuery = applyRecentlyAskedFilter(hardQuery, params.RecentlyAsked, normalizedCompanies)
		if err := hardQuery.Limit(params.NumHardProblems).Order(clause.Expr{
			SQL: "RANDOM()",
		}).Find(&hardProblems).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, false, err
	}

	exactDifficultySatisfied :=
		len(easyProblems) >= params.NumEasyProblems &&
			len(mediumProblems) >= params.NumMediumProblems &&
			len(hardProblems) >= params.NumHardProblems

	problems = append(easyProblems, mediumProblems...)
	problems = append(problems, hardProblems...)

	// If exact per-difficulty selection is not possible, keep tag/company filters and fill
	// remaining slots from any difficulty. RecentlyAsked is deliberately dropped here (like
	// difficulty, unlike tags/companies) - its pool is small by design, so treating it as a
	// hard requirement even in the fallback would turn "not enough recent problems" into a
	// full round-creation failure instead of a graceful, older-problem substitution.
	if len(problems) < requestedTotal {
		fallbackUsed = true
		missing := requestedTotal - len(problems)
		selectedIDs := make([]uint, 0, len(problems))
		for _, problem := range problems {
			selectedIDs = append(selectedIDs, problem.ID)
		}

		var fallbackProblems []models.Problem
		fallbackQuery := service.db.Clauses(clause.OrderBy{
			Expression: clause.Expr{SQL: "RANDOM()"},
		}).Where("is_paid = ?", false)
		fallbackQuery = applyTagFilters(fallbackQuery, normalizedTags)
		fallbackQuery = applyCompanyFilters(fallbackQuery, normalizedCompanies)
		fallbackQuery = applyProblemListFilters(fallbackQuery, params.Blind75, params.NeetCode150)
		if len(selectedIDs) > 0 {
			fallbackQuery = fallbackQuery.Where("id NOT IN ?", selectedIDs)
		}
		if err := fallbackQuery.Limit(missing).Find(&fallbackProblems).Error; err != nil {
			return nil, false, err
		}
		problems = append(problems, fallbackProblems...)
	}

	if len(problems) < requestedTotal {
		return nil, false, BSGError{
			StatusCode: 400,
			Message: fmt.Sprintf(
				"Not enough tagged problems found. requested_total=%d found_total=%d requested={easy:%d,medium:%d,hard:%d} found={easy:%d,medium:%d,hard:%d} tags=%v companies=%v",
				requestedTotal,
				len(problems),
				params.NumEasyProblems,
				params.NumMediumProblems,
				params.NumHardProblems,
				len(easyProblems),
				len(mediumProblems),
				len(hardProblems),
				normalizedTags,
				normalizedCompanies,
			),
		}
	}

	if !exactDifficultySatisfied {
		fallbackUsed = true
	}

	return problems, fallbackUsed, nil
}

func applyTagFilters(query *gorm.DB, tags []string) *gorm.DB {
	if len(tags) == 0 {
		return query
	}

	orParts := make([]string, 0, len(tags))
	orArgs := make([]interface{}, 0, len(tags))
	for _, tag := range tags {
		orParts = append(orParts, "LOWER(tags) LIKE ?")
		orArgs = append(orArgs, "%\""+strings.ToLower(escapeLikePattern(tag))+"\"%")
	}

	return query.Where("("+strings.Join(orParts, " OR ")+")", orArgs...)
}

// applyCompanyFilters restricts query to problems tagged with at least one of the
// given companies (case-insensitive), via a subquery against ProblemCompanyTag -
// unlike Tags, companies live in a separate join table rather than a column on Problem.
func applyCompanyFilters(query *gorm.DB, companies []string) *gorm.DB {
	if len(companies) == 0 {
		return query
	}

	normalized := make([]string, len(companies))
	for i, company := range companies {
		normalized[i] = strings.ToLower(company)
	}

	subquery := query.Session(&gorm.Session{NewDB: true}).
		Model(&models.ProblemCompanyTag{}).
		Select("problem_id").
		Where("LOWER(company) IN ?", normalized)

	return query.Where("id IN (?)", subquery)
}

// applyProblemListFilters restricts query to problems in the selected curated lists.
// Blind75 and NeetCode150 live as plain boolean columns on Problem (unlike Companies)
// since each problem's list membership is fixed data, not a variable-length relationship.
// When both are selected, matches either list (OR), not just problems in both.
func applyProblemListFilters(query *gorm.DB, blind75 bool, neetCode150 bool) *gorm.DB {
	if !blind75 && !neetCode150 {
		return query
	}
	if blind75 && neetCode150 {
		return query.Where("is_blind75 = ? OR is_neetcode150 = ?", true, true)
	}
	if blind75 {
		return query.Where("is_blind75 = ?", true)
	}
	return query.Where("is_neetcode150 = ?", true)
}

// applyRecentlyAskedFilter restricts query to problems asked by the given companies
// within the last 6 months (ThirtyDays/ThreeMonths/SixMonths windows), via a subquery
// against ProblemCompanyTag - same subquery shape as applyCompanyFilters. No-op unless
// recentlyAsked is true and at least one company is selected, since recency is only
// meaningful relative to a selected company.
func applyRecentlyAskedFilter(query *gorm.DB, recentlyAsked bool, companies []string) *gorm.DB {
	if !recentlyAsked || len(companies) == 0 {
		return query
	}

	normalized := make([]string, len(companies))
	for i, company := range companies {
		normalized[i] = strings.ToLower(company)
	}

	windowConditions := make([]string, len(recentlyAskedWindows))
	windowArgs := make([]interface{}, len(recentlyAskedWindows))
	for i, window := range recentlyAskedWindows {
		windowConditions[i] = "windows LIKE ?"
		windowArgs[i] = "%\"" + window + "\"%"
	}

	subquery := query.Session(&gorm.Session{NewDB: true}).
		Model(&models.ProblemCompanyTag{}).
		Select("problem_id").
		Where("LOWER(company) IN ?", normalized).
		Where("("+strings.Join(windowConditions, " OR ")+")", windowArgs...)

	return query.Where("id IN (?)", subquery)
}

func (service *ProblemService) FindProblemCompanyStats() ([]models.ProblemCompanyStat, error) {
	var stats []models.ProblemCompanyStat
	result := service.db.Order("total_count DESC").Order("company ASC").Find(&stats)
	if result.Error != nil {
		return nil, result.Error
	}
	return stats, nil
}

func (service *ProblemService) DetermineScoreForProblem(problem *models.Problem) uint {
	if problem.Difficulty == constants.DIFFICULTY_EASY {
		return 3
	}

	if problem.Difficulty == constants.DIFFICULTY_MEDIUM {
		return 4
	}

	return 5
}

func (service *ProblemService) FindProblemBySlug(slug string) (*models.Problem, error) {
	var problem models.Problem
	result := service.db.Where("slug = ?", slug).Limit(1).Find(&problem)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil // Not found
	}
	return &problem, nil
}

func (service *ProblemService) FindProblemTagStats() ([]models.ProblemTagStat, error) {
	var stats []models.ProblemTagStat
	result := service.db.Order("total_count DESC").Order("tag ASC").Find(&stats)
	if result.Error != nil {
		return nil, result.Error
	}
	return stats, nil
}
