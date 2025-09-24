const mockEnrichmentData = require("../data/company-enrichment.json");
const cacheService = require("./cacheService");

/**
 * Company Enrichment Service
 * Simulates premium enrichment services like ZoomInfo
 */
class CompanyEnrichmentService {
  /**
   * Simulates a call to a premium enrichment service like ZoomInfo.
   * @param {string} domain The company domain to enrich.
   * @returns {Promise<Object|null>} A promise that resolves with the enriched data or null if not found.
   */
  static async enrichCompanyData(domain) {
    console.log(
      `[Service] Simulating API call to ZoomInfo for domain: ${domain}...`
    );

    // Check cache first
    const cacheKey = `company_enrichment_${domain}`;
    const cachedData = cacheService.get(cacheKey);

    if (cachedData !== undefined) {
      console.log(`[Cache] Using cached company data for domain: ${domain}`);
      return cachedData;
    }

    // Simulate network latency for realistic development experience
    await new Promise((resolve) => setTimeout(resolve, 800));

    const enrichedData = mockEnrichmentData[domain] || null;

    if (!enrichedData) {
      console.log(`[Service] No enriched data found for domain: ${domain}.`);
      // Cache null results for shorter time (1 hour)
      cacheService.set(cacheKey, null, 60 * 60);
      return null;
    }

    console.log(`[Service] Successfully enriched data for domain: ${domain}`);

    // Cache successful enrichments for longer time (24 hours)
    cacheService.set(cacheKey, enrichedData, 24 * 60 * 60);
    return enrichedData;
  }

  /**
   * Get all available domains for testing
   * @returns {Array<string>} Array of available domains
   */
  static getAvailableDomains() {
    return Object.keys(mockEnrichmentData);
  }

  /**
   * Check if domain has enrichment data
   * @param {string} domain The domain to check
   * @returns {boolean} True if domain has enrichment data
   */
  static hasEnrichmentData(domain) {
    return domain in mockEnrichmentData;
  }

  /**
   * Generate fallback enrichment data for unknown domains
   * @param {string} domain The domain to generate data for
   * @param {string} companyName The company name from IP data
   * @returns {Object} Fallback enrichment data
   */
  static generateFallbackData(domain, companyName) {
    console.log(
      `[Service] Generating fallback enrichment data for ${domain}...`
    );

    return {
      company_name: companyName,
      domain: domain,
      employees: Math.floor(Math.random() * 5000) + 100,
      industry: "Technology",
      headquarters: "Unknown",
      revenue: "N/A",
      website: `https://www.${domain}`,
      enrichment_source: "fallback",
    };
  }
}

module.exports = CompanyEnrichmentService;
