# Apify LinkedIn Job Scraper - Deep Dive Analysis

## User Requirements
- ✅ Pay-per-use pricing (no subscriptions)
- ✅ No session cookies required
- ✅ Best value for money

## Comprehensive Comparison

### Top 3 Recommendations

---

## 🥇 #1 RECOMMENDATION: cheap_scraper/linkedin-job-scraper

**Actor ID:** `2rJKkhh7vjpX7pvjg`  
**URL:** https://apify.com/cheap_scraper/linkedin-job-scraper

### Pricing
- **Free Tier:** $0.70 per 1,000 results
- **Bronze Tier:** $0.60 per 1,000 results  
- **Silver Tier:** $0.50 per 1,000 results
- **Gold Tier:** $0.35 per 1,000 results (lowest price!)

### Why This Is #1
1. **Lowest Cost:** Starting at $0.35/1K (Gold tier) - cheapest option found
2. **No Cookies:** Explicitly states "No cookies or account required"
3. **Pay-Per-Result:** True pay-per-use model, no subscriptions
4. **High Adoption:** 1.7K total users, 207 monthly active - proven reliability
5. **Excellent Rating:** 4.8/5 (14 reviews) - highest rated among affordable options
6. **Deduplication:** Built-in duplicate removal saves money
7. **Flexible Input:** Supports both URLs and keyword searches
8. **Company Enrichment:** Optional company data enrichment (can disable for speed)
9. **Active Maintenance:** Last modified 7 days ago - actively maintained
10. **Fast Response:** 4.6 hour average issue response time

### Features
- ✅ Keyword-based search
- ✅ URL-based search  
- ✅ Location filtering
- ✅ Date range filtering (Last 24 hours, 7 days, 30 days)
- ✅ Job type filtering (Full-time, Part-time, Contract, etc.)
- ✅ Experience level filtering
- ✅ Work type filtering (On-site, Remote, Hybrid)
- ✅ Salary filtering
- ✅ Duplicate removal option
- ✅ Company enrichment (optional)

### Cost Examples
- 50 jobs: $0.0175 (Gold tier)
- 500 jobs: $0.175 (Gold tier)
- 1,000 jobs: $0.35 (Gold tier)
- 5,000 jobs: $1.75 (Gold tier)

### Limitations
- Maximum 1,000 jobs per search query (LinkedIn limitation)
- Minimum 150 results required for pay-per-result billing

### Best For
- **High-volume scraping** (best value)
- **Cost-conscious users**
- **Users who need deduplication**
- **Flexible search requirements**

---

## 🥈 #2 RECOMMENDATION: data_wizard/linkedin-job-scraper

**Actor ID:** `DugEixombBNfk96G9`  
**URL:** https://apify.com/data_wizard/linkedin-job-scraper

### Pricing
- **$0.99 per 1,000 jobs** (fixed rate)

### Why This Is #2
1. **Speed Leader:** Scrapes 1,000 jobs in under 2 minutes (fastest)
2. **No Cookies:** Uses LinkedIn's guest API - no authentication needed
3. **Pay-Per-Result:** True pay-per-use, no subscriptions
4. **Built-in Proxies:** Datacenter proxy rotation included (no extra setup)
5. **No Setup Required:** Zero configuration needed
6. **Transparent Pricing:** Fixed rate, no tier complexity
7. **Fresh Data:** No caching, always current data
8. **Reliable:** Uses LinkedIn's official guest API (more stable)

### Features
- ✅ Job title search
- ✅ Location filtering
- ✅ Built-in proxy rotation
- ✅ Multiple export formats (CSV, JSON, Excel, etc.)
- ✅ Fast processing (< 2 min for 1K jobs)

### Cost Examples
- 50 jobs: $0.0495
- 500 jobs: $0.495
- 1,000 jobs: $0.99
- 5,000 jobs: $4.95

### Limitations
- Slightly more expensive than #1 option
- Less user adoption (57 total users vs 1.7K)
- Newer actor (4 months old)

### Best For
- **Speed-critical applications**
- **Users who want simplicity** (no tier management)
- **Users who need built-in proxy handling**
- **Time-sensitive scraping**

---

## 🥉 #3 RECOMMENDATION: practicaltools/linkedin-jobs

**Actor ID:** `SnNEWiOAQe9V9bEzL`  
**URL:** https://apify.com/practicaltools/linkedin-jobs

### Pricing
- **$0.70 per 1,000 jobs** (from $0.70, may have tiers)

### Why This Is #3
1. **AI-Powered Search:** Natural language query support (unique feature)
2. **No Cookies:** Explicitly states "no cookies, no hassle"
3. **Pay-As-You-Go:** True pay-per-use model
4. **Comprehensive Filtering:** Advanced filters (experience, work type, salary, etc.)
5. **Multiple Search Modes:** Traditional form-based OR AI-powered natural language
6. **Fair Billing:** Only pay for successfully scraped jobs
7. **Guest API:** Uses LinkedIn's guest API (stable)

### Features
- ✅ AI-powered natural language search (requires OpenAI API key)
- ✅ Traditional form-based search
- ✅ Advanced filtering options
- ✅ Multiple company search
- ✅ High-volume enterprise support
- ✅ Comprehensive data extraction

### Cost Examples
- 50 jobs: $0.035
- 500 jobs: $0.35
- 1,000 jobs: $0.70
- 5,000 jobs: $3.50

### Limitations
- Lower user adoption (103 total users, 18 monthly)
- Lower rating (2.7/5 from 3 reviews) - may have had early issues
- AI feature requires OpenAI API key (additional cost ~$0.001 per query)
- Slower issue response (8.4 hours average)

### Best For
- **Users who want AI-powered search**
- **Complex search requirements**
- **Users comfortable with natural language queries**
- **Enterprise-level filtering needs**

---

## Other Notable Options (Not Top 3)

### reliable_actor/apify-linkedin-job-search
- **Price:** $2.00 per 1,000 results
- **Pros:** Explicitly "NO COOKIES", fast (~2 min for 1K), concurrent scraping
- **Cons:** More expensive than top 3, lower user base (100 users)
- **Rating:** 0.0/5 (no reviews yet)

### curious_coder/linkedin-jobs-scraper
- **Price:** ~$1 per 1,000 results (pay-per-result)
- **Pros:** High adoption (13K users), excellent rating (4.9/5)
- **Cons:** May require cookies (not explicitly stated as "no cookies")
- **Note:** Very popular but unclear on cookie requirements

---

## Final Recommendation Summary

### For Maximum Cost Savings: 
**#1 - cheap_scraper/linkedin-job-scraper** ($0.35/1K at Gold tier)
- Best value for money
- Highest rated affordable option
- Most flexible features

### For Maximum Speed:
**#2 - data_wizard/linkedin-job-scraper** ($0.99/1K)
- Fastest scraping (< 2 min for 1K jobs)
- Built-in proxy rotation
- Simplest setup

### For Advanced Features:
**#3 - practicaltools/linkedin-jobs** ($0.70/1K)
- AI-powered natural language search
- Most comprehensive filtering
- Enterprise features

---

## Implementation Recommendation

**Start with #1 (cheap_scraper)** because:
1. Lowest cost ($0.35/1K vs $0.99/1K vs $0.70/1K)
2. No cookies required ✅
3. Pay-per-use ✅
4. Proven reliability (1.7K users, 4.8/5 rating)
5. Active maintenance
6. Built-in deduplication saves money

**Fallback to #2 (data_wizard)** if:
- Speed becomes critical
- You need built-in proxy handling
- Simplicity is more important than cost

---

## Cost Comparison Table

| Actor | Price/1K | Speed | Rating | Users | Cookies? |
|-------|----------|-------|--------|-------|----------|
| **cheap_scraper** | **$0.35** | Medium | 4.8/5 | 1.7K | ❌ No |
| **data_wizard** | $0.99 | **Fastest** | 4.0/5 | 57 | ❌ No |
| **practicaltools** | $0.70 | Medium | 2.7/5 | 103 | ❌ No |
| reliable_actor | $2.00 | Fast | 0.0/5 | 100 | ❌ No |

---

## Next Steps

1. **Update config.json** with actor ID: `2rJKkhh7vjpX7pvjg` (cheap_scraper)
2. **Test with small batch** (50-100 jobs) to verify data quality
3. **Monitor costs** and adjust if needed
4. **Consider upgrading to Gold tier** if scraping >1K jobs/month for best pricing
