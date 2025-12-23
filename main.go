package main

import (
	"encoding/json"
	"html/template"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// API response structures
type Transaction struct {
	ID         uint      `json:"id"`
	CategoryID uint      `json:"category_id"`
	Amount     int       `json:"amount"`
	Type       string    `json:"type"`
	Date       time.Time `json:"date"`
	Memo       string    `json:"memo"`
	Category   *Category `json:"category,omitempty"`
}

type Category struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

type MonthlySummary struct {
	Year    int `json:"year"`
	Month   int `json:"month"`
	Income  int `json:"income"`
	Expense int `json:"expense"`
	Balance int `json:"balance"`
}

type CategorySummary struct {
	CategoryID   uint   `json:"category_id"`
	CategoryName string `json:"category_name"`
	Type         string `json:"type"`
	Total        int    `json:"total"`
}

type YearlySummary struct {
	Year    int              `json:"year"`
	Income  int              `json:"income"`
	Expense int              `json:"expense"`
	Balance int              `json:"balance"`
	Monthly []MonthlySummary `json:"monthly"`
}

type TransactionListResponse struct {
	Data   []Transaction `json:"data"`
	Total  int64         `json:"total"`
	Limit  int           `json:"limit"`
	Offset int           `json:"offset"`
}

type CategoryListResponse struct {
	Data []Category `json:"data"`
}

type CategorySummaryResponse struct {
	Data      []CategorySummary `json:"data"`
	StartDate string            `json:"start_date"`
	EndDate   string            `json:"end_date"`
}

// Filter struct for transaction list
type TransactionFilter struct {
	Type      string
	StartDate string
	EndDate   string
	Limit     int
}

var (
	apiBaseURL string
	templates  *template.Template
)

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	// API base URL
	apiBaseURL = os.Getenv("API_URL")
	if apiBaseURL == "" {
		apiBaseURL = "http://localhost:8080"
	}

	// Parse templates with custom functions
	funcMap := template.FuncMap{
		"formatNumber": formatNumber,
		"formatDate":   formatDate,
		"toJSON":       toJSON,
		"subtract":     func(a, b int) int { return a - b },
		"add":          func(a, b int) int { return a + b },
		"multiply":     func(a, b int) int { return a * b },
		"min":          func(a, b int64) int64 { if a < b { return a }; return b },
		"ge":           func(a, b int) bool { return a >= b },
		"eq":           func(a, b interface{}) bool { return a == b },
		"gt":           func(a, b int) bool { return a > b },
	}

	templates = template.Must(template.New("").Funcs(funcMap).ParseGlob("templates/**/*.html"))

	r := gin.Default()

	// Serve static files
	r.Static("/static", "./static")

	// Main page
	r.GET("/", func(c *gin.Context) {
		c.File("templates/index.html")
	})

	// Page fragments for HTMX
	r.GET("/pages/dashboard", handleDashboard)
	r.GET("/pages/transactions", handleTransactions)
	r.GET("/pages/categories", handleCategories)

	// Proxy API requests
	r.Any("/api/*path", proxyToAPI)

	// Get port
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Frontend server starting on port %s", port)
	log.Printf("Proxying API requests to %s", apiBaseURL)

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

// Template functions
func formatNumber(n int) string {
	// Simple thousands separator
	s := strconv.Itoa(n)
	if n < 0 {
		s = strconv.Itoa(-n)
	}

	var result strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			result.WriteRune(',')
		}
		result.WriteRune(c)
	}

	if n < 0 {
		return "-" + result.String()
	}
	return result.String()
}

func formatDate(t time.Time) string {
	return t.Format("2006/01/02")
}

func toJSON(v interface{}) template.JS {
	b, _ := json.Marshal(v)
	return template.JS(b)
}

// Dashboard page handler
func handleDashboard(c *gin.Context) {
	now := time.Now()
	year := now.Year()
	month := int(now.Month())

	// Fetch monthly summary
	monthlyResp, err := fetchAPI(c, "/api/v1/summary/monthly?year=%d&month=%d", year, month)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to fetch monthly summary")
		return
	}
	var monthly MonthlySummary
	json.Unmarshal(monthlyResp, &monthly)

	// Fetch category summary
	categoryResp, err := fetchAPI(c, "/api/v1/summary/category")
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to fetch category summary")
		return
	}
	var categorySummary CategorySummaryResponse
	json.Unmarshal(categoryResp, &categorySummary)

	// Filter expense categories for chart
	var expenseCategories []CategorySummary
	for _, cs := range categorySummary.Data {
		if cs.Type == "expense" && cs.Total > 0 {
			expenseCategories = append(expenseCategories, cs)
		}
	}

	// Fetch yearly summary
	yearlyResp, err := fetchAPI(c, "/api/v1/summary/yearly?year=%d", year)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to fetch yearly summary")
		return
	}
	var yearly YearlySummary
	json.Unmarshal(yearlyResp, &yearly)

	// Fetch recent transactions
	recentResp, err := fetchAPI(c, "/api/v1/transactions?limit=5")
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to fetch recent transactions")
		return
	}
	var recentList TransactionListResponse
	json.Unmarshal(recentResp, &recentList)

	// Render template
	data := gin.H{
		"Year":               year,
		"Month":              month,
		"Monthly":            monthly,
		"Categories":         categorySummary.Data,
		"ExpenseCategories":  expenseCategories,
		"Yearly":             yearly,
		"RecentTransactions": recentList.Data,
	}

	c.Header("Content-Type", "text/html")
	if err := templates.ExecuteTemplate(c.Writer, "dashboard", data); err != nil {
		log.Printf("Template error: %v", err)
		c.String(http.StatusInternalServerError, "Template error")
	}
}

// Transactions page handler
func handleTransactions(c *gin.Context) {
	// Parse query parameters
	filter := TransactionFilter{
		Type:      c.Query("type"),
		StartDate: c.Query("start_date"),
		EndDate:   c.Query("end_date"),
		Limit:     20,
	}

	if l := c.Query("limit"); l != "" {
		if limit, err := strconv.Atoi(l); err == nil {
			filter.Limit = limit
		}
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if pageNum, err := strconv.Atoi(p); err == nil && pageNum > 0 {
			page = pageNum
		}
	}

	offset := (page - 1) * filter.Limit

	// Build API query
	apiQuery := "/api/v1/transactions?limit=%d&offset=%d"
	args := []interface{}{filter.Limit, offset}

	if filter.Type != "" {
		apiQuery += "&type=%s"
		args = append(args, filter.Type)
	}
	if filter.StartDate != "" {
		apiQuery += "&start_date=%s"
		args = append(args, filter.StartDate)
	}
	if filter.EndDate != "" {
		apiQuery += "&end_date=%s"
		args = append(args, filter.EndDate)
	}

	// Fetch transactions
	resp, err := fetchAPI(c, apiQuery, args...)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	var list TransactionListResponse
	json.Unmarshal(resp, &list)

	// Calculate pagination
	totalPages := int((list.Total + int64(filter.Limit) - 1) / int64(filter.Limit))
	if totalPages < 1 {
		totalPages = 1
	}

	// Generate page numbers for pagination
	var pages []int
	for i := 1; i <= totalPages; i++ {
		if i <= 3 || i > totalPages-3 || (i >= page-1 && i <= page+1) {
			pages = append(pages, i)
		}
	}

	// Build filter query string for CSV export
	var filterParts []string
	if filter.Type != "" {
		filterParts = append(filterParts, "type="+filter.Type)
	}
	if filter.StartDate != "" {
		filterParts = append(filterParts, "start_date="+filter.StartDate)
	}
	if filter.EndDate != "" {
		filterParts = append(filterParts, "end_date="+filter.EndDate)
	}
	filterQuery := strings.Join(filterParts, "&")

	data := gin.H{
		"Transactions": list.Data,
		"Total":        list.Total,
		"Filter":       filter,
		"FilterQuery":  filterQuery,
		"CurrentPage":  page,
		"TotalPages":   totalPages,
		"Pages":        pages,
	}

	c.Header("Content-Type", "text/html")
	if err := templates.ExecuteTemplate(c.Writer, "transactions", data); err != nil {
		log.Printf("Template error: %v", err)
		c.String(http.StatusInternalServerError, "Template error")
	}
}

// Categories page handler
func handleCategories(c *gin.Context) {
	// Fetch all categories
	resp, err := fetchAPI(c, "/api/v1/categories")
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to fetch categories")
		return
	}

	var list CategoryListResponse
	json.Unmarshal(resp, &list)

	// Separate by type
	var incomeCategories, expenseCategories []Category
	for _, cat := range list.Data {
		if cat.Type == "income" {
			incomeCategories = append(incomeCategories, cat)
		} else {
			expenseCategories = append(expenseCategories, cat)
		}
	}

	data := gin.H{
		"IncomeCategories":  incomeCategories,
		"ExpenseCategories": expenseCategories,
	}

	c.Header("Content-Type", "text/html")
	if err := templates.ExecuteTemplate(c.Writer, "categories", data); err != nil {
		log.Printf("Template error: %v", err)
		c.String(http.StatusInternalServerError, "Template error")
	}
}

// Fetch data from API
func fetchAPI(c *gin.Context, pathFmt string, args ...interface{}) ([]byte, error) {
	path := pathFmt
	if len(args) > 0 {
		path = formatPath(pathFmt, args...)
	}

	apiURL := apiBaseURL + path
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	// Forward user ID header if present
	if userID := c.GetHeader("X-User-ID"); userID != "" {
		req.Header.Set("X-User-ID", userID)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

// Simple path formatter (avoiding fmt.Sprintf for flexibility)
func formatPath(format string, args ...interface{}) string {
	result := format
	for _, arg := range args {
		switch v := arg.(type) {
		case int:
			result = strings.Replace(result, "%d", strconv.Itoa(v), 1)
		case string:
			result = strings.Replace(result, "%s", v, 1)
		case int64:
			result = strings.Replace(result, "%d", strconv.FormatInt(v, 10), 1)
		}
	}
	return result
}

// Proxy API requests to backend
func proxyToAPI(c *gin.Context) {
	target, _ := url.Parse(apiBaseURL)

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Director = func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.Host = target.Host

		// Forward user ID header
		if userID := c.GetHeader("X-User-ID"); userID != "" {
			req.Header.Set("X-User-ID", userID)
		}
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}
