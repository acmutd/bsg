// Command fetch-company-problems is a one-off, manually-run tool that pulls
// the company-wise problem lists from
// https://github.com/liquidslr/leetcode-company-wise-problems and flattens
// them into seed-service/company_problems.csv, which SeedingService.SeedCompanyProblems
// reads at central-service startup. It is not part of the central-service
// binary or the docker build - re-run it manually (`go run ./cmd/fetch-company-problems`)
// whenever the upstream data should be refreshed.
package main

import (
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	repoOwner  = "liquidslr"
	repoName   = "leetcode-company-wise-problems"
	repoBranch = "main"
	concurrency = 10
)

// windowFiles maps each per-company CSV to the short code stored in the
// output file's Windows column.
var windowFiles = []struct {
	file string
	code string
}{
	{"1. Thirty Days.csv", "ThirtyDays"},
	{"2. Three Months.csv", "ThreeMonths"},
	{"3. Six Months.csv", "SixMonths"},
	{"4. More Than Six Months.csv", "MoreThanSixMonths"},
	{"5. All.csv", "All"},
}

type contentEntry struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type pairKey struct {
	slug    string
	company string
}

type pairData struct {
	frequency float64
	windows   map[string]bool
}

func main() {
	outPath := flag.String("out", "../seed-service/company_problems.csv", "output CSV path")
	flag.Parse()

	companies, err := listCompanies()
	if err != nil {
		log.Fatalf("failed to list companies: %v", err)
	}
	log.Printf("found %d companies", len(companies))

	results := make(chan map[pairKey]*pairData, len(companies))
	sem := make(chan struct{}, concurrency)
	var wg sync.WaitGroup

	for _, company := range companies {
		wg.Add(1)
		go func(company string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			pairs, err := fetchCompany(company)
			if err != nil {
				log.Printf("warning: %s: %v", company, err)
			}
			results <- pairs
		}(company)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	merged := make(map[pairKey]*pairData)
	for pairs := range results {
		for key, data := range pairs {
			existing, ok := merged[key]
			if !ok {
				merged[key] = data
				continue
			}
			if data.frequency > existing.frequency {
				existing.frequency = data.frequency
			}
			for w := range data.windows {
				existing.windows[w] = true
			}
		}
	}

	if err := writeOutput(*outPath, merged); err != nil {
		log.Fatalf("failed to write output: %v", err)
	}
	log.Printf("wrote %d (slug, company) pairs to %s", len(merged), *outPath)
}

func listCompanies() ([]string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/", repoOwner, repoName)
	body, err := getWithRetry(url)
	if err != nil {
		return nil, err
	}
	var entries []contentEntry
	if err := json.Unmarshal(body, &entries); err != nil {
		return nil, err
	}
	var companies []string
	for _, e := range entries {
		if e.Type == "dir" {
			companies = append(companies, e.Name)
		}
	}
	sort.Strings(companies)
	return companies, nil
}

func fetchCompany(company string) (map[pairKey]*pairData, error) {
	pairs := make(map[pairKey]*pairData)
	for _, w := range windowFiles {
		rawURL := fmt.Sprintf(
			"https://raw.githubusercontent.com/%s/%s/%s/%s/%s",
			repoOwner, repoName, repoBranch,
			url.PathEscape(company), url.PathEscape(w.file),
		)
		body, err := getWithRetry(rawURL)
		if err != nil {
			// Not every company necessarily has every window populated; skip and continue.
			continue
		}
		if err := parseCompanyCSV(body, company, w.code, pairs); err != nil {
			log.Printf("warning: %s/%s: %v", company, w.file, err)
		}
	}
	return pairs, nil
}

func parseCompanyCSV(body []byte, company, windowCode string, out map[pairKey]*pairData) error {
	reader := csv.NewReader(strings.NewReader(string(body)))
	reader.FieldsPerRecord = -1
	header, err := reader.Read()
	if err != nil {
		if err == io.EOF {
			return nil
		}
		return err
	}
	index := make(map[string]int, len(header))
	for i, col := range header {
		index[strings.ToLower(strings.TrimSpace(col))] = i
	}
	linkIdx, ok := index["link"]
	if !ok {
		return fmt.Errorf("missing Link column")
	}
	freqIdx, hasFreq := index["frequency"]

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}
		if linkIdx >= len(record) {
			continue
		}
		slug := slugFromLink(record[linkIdx])
		if slug == "" {
			continue
		}
		var freq float64
		if hasFreq && freqIdx < len(record) {
			freq, _ = strconv.ParseFloat(strings.TrimSpace(record[freqIdx]), 64)
		}
		key := pairKey{slug: slug, company: company}
		data, ok := out[key]
		if !ok {
			data = &pairData{windows: make(map[string]bool)}
			out[key] = data
		}
		if freq > data.frequency {
			data.frequency = freq
		}
		data.windows[windowCode] = true
	}
	return nil
}

// slugFromLink extracts "two-sum" from "https://leetcode.com/problems/two-sum" or ".../two-sum/".
func slugFromLink(link string) string {
	link = strings.TrimSpace(link)
	link = strings.TrimSuffix(link, "/")
	const marker = "/problems/"
	idx := strings.Index(link, marker)
	if idx == -1 {
		return ""
	}
	slug := link[idx+len(marker):]
	if i := strings.IndexAny(slug, "/?"); i != -1 {
		slug = slug[:i]
	}
	return slug
}

func writeOutput(path string, merged map[pairKey]*pairData) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	if err := writer.Write([]string{"Slug", "Company", "Frequency", "Windows"}); err != nil {
		return err
	}

	keys := make([]pairKey, 0, len(merged))
	for key := range merged {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].slug != keys[j].slug {
			return keys[i].slug < keys[j].slug
		}
		return keys[i].company < keys[j].company
	})

	for _, key := range keys {
		data := merged[key]
		windows := make([]string, 0, len(data.windows))
		for w := range data.windows {
			windows = append(windows, w)
		}
		sort.Strings(windows)
		record := []string{
			key.slug,
			key.company,
			strconv.FormatFloat(data.frequency, 'f', -1, 64),
			strings.Join(windows, ";"),
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}
	return nil
}

func getWithRetry(target string) ([]byte, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		req, err := http.NewRequest(http.MethodGet, target, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("User-Agent", "bsg-fetch-company-problems")
		if token := os.Getenv("GITHUB_TOKEN"); token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
			continue
		}
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode == http.StatusNotFound {
			return nil, fmt.Errorf("404 not found: %s", target)
		}
		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("unexpected status %d for %s", resp.StatusCode, target)
			time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
			continue
		}
		return body, nil
	}
	return nil, lastErr
}
