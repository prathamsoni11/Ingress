const mockIpDatabase = require("../data/ip-database.json");
const CompanyEnrichmentService = require("./companyEnrichmentService");
const cacheService = require("./cacheService");
const Logger = require("../utils/logger");

/**
 * IP Enrichment Service
 * Handles IP lookup, filtering, and enrichment logic
 */
class IPEnrichmentService {
  /**
   * Perform IP lookup and enrichment
   * @param {string} ipAddress - The IP address to lookup
   * @returns {Object} Enrichment result
   */
  static async enrichIP(ipAddress) {
    Logger.info(
      "IPEnrichment",
      `Performing initial lookup for IP: ${ipAddress}`
    );

    // Check cache first
    const cacheKey = `ip_enrichment_${ipAddress}`;
    const cachedResult = cacheService.get(cacheKey);

    if (cachedResult) {
      Logger.info("IPEnrichment", `Using cached result for IP: ${ipAddress}`);
      return cachedResult;
    }

    const ipinfoResult = mockIpDatabase[ipAddress] || null;

    if (!ipinfoResult) {
      Logger.info(
        "IPEnrichment",
        "No match found. Filtering this traffic out."
      );
      const result = {
        status: "filtered",
        reason: "No data found for this IP.",
      };

      // Cache filtered results for shorter time (1 hour)
      cacheService.set(cacheKey, result, 60 * 60);
      return result;
    }

    // Filter ISP and hosting providers
    if (ipinfoResult.type === "isp" || ipinfoResult.type === "hosting") {
      Logger.info(
        "IPEnrichment",
        `IP belongs to ISP/Hosting service: ${ipinfoResult.as_name}. Filtering out.`
      );
      const result = {
        status: "filtered",
        reason: "ISP or Hosting",
      };

      // Cache filtered results for shorter time (1 hour)
      cacheService.set(cacheKey, result, 60 * 60);
      return result;
    }

    Logger.info(
      "IPEnrichment",
      `IP matched to business: ${ipinfoResult.as_name}. Domain: ${ipinfoResult.as_domain}`
    );
    Logger.info(
      "IPEnrichment",
      `Beginning enrichment waterfall for domain: ${ipinfoResult.as_domain}`
    );

    // Get enriched company data using the new service
    let zoomInfoData = await CompanyEnrichmentService.enrichCompanyData(
      ipinfoResult.as_domain
    );

    // If no specific enrichment data found, generate fallback data
    if (!zoomInfoData) {
      zoomInfoData = CompanyEnrichmentService.generateFallbackData(
        ipinfoResult.as_domain,
        ipinfoResult.as_name
      );
    }

    const result = {
      status: "success",
      data: {
        ...ipinfoResult,
        zoominfo_data: zoomInfoData,
      },
    };

    // Cache successful enrichments for longer time (24 hours)
    cacheService.set(cacheKey, result, 24 * 60 * 60);
    return result;
  }

  /**
   * Get available domains for testing
   * @returns {Array<string>} Array of domains with enrichment data
   */
  static getAvailableEnrichmentDomains() {
    return CompanyEnrichmentService.getAvailableDomains();
  }
}

module.exports = IPEnrichmentService;
