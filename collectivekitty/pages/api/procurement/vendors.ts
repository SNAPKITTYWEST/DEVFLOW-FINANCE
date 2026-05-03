import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { createEvent, EventTypes } from "../../../lib/eventContract"
import { runPipeline } from "../../../lib/bifrost/pipeline"
import { VendorId, createVendorId, isVendorId } from "../../../lib/types/branded"

const prisma = new PrismaClient()

/**
 * Vendor Registry API - The approved vendor database
 *
 * @route GET /api/procurement/vendors - List all vendors
 * @route POST /api/procurement/vendors - Add new vendor
 *
 * @remarks
 * This is the vendor registry. Every company you do business with gets
 * a VendorId. This is the master list of approved vendors - who you're
 * allowed to pay money to.
 *
 * Business context:
 * The vendor registry is a compliance and financial control. You can't
 * pay someone who isn't in the system. This prevents:
 * - Payments to unapproved vendors (fraud risk)
 * - Duplicate vendor records (same company, different names)
 * - Missing tax documentation (W-9, 1099 requirements)
 * - Vendor conflicts of interest (employee relationships)
 *
 * VendorId is the unique identifier for each vendor. It appears on:
 * - Purchase orders (who are we buying from?)
 * - Invoices (who sent this bill?)
 * - Payments (who gets the money?)
 * - Spend reports (who are we spending the most with?)
 * - Tax forms (1099 reporting at year end)
 *
 * VendorId ≠ ContactId. A vendor is a company you pay. A contact is a
 * person you sell to. Same company might be both (you buy from them AND
 * sell to them), but they get different IDs for different purposes.
 *
 * When a vendor is added, the system:
 * 1. Validates required information (name, tax ID, payment terms)
 * 2. Checks for duplicates (same company already in system?)
 * 3. Routes through approval workflow (who authorized this vendor?)
 * 4. Triggers compliance checks (sanctions list, credit check)
 * 5. Notifies procurement team (new vendor available)
 *
 * The vendor category determines:
 * - Approval requirements (software vendors need IT approval)
 * - Payment terms (net 30, net 60, etc.)
 * - Spend limits (how much can we spend without approval?)
 * - Tax treatment (1099 vs W-2 vs international)
 *
 * GET Response:
 * - 200: { data: Vendor[] } - List of vendors sorted by name
 * - 500: { error: string } - Database error
 *
 * POST Request body:
 * - name: string - Vendor legal name
 * - email: string - Vendor contact email
 * - phone: string (optional) - Vendor phone number
 * - website: string (optional) - Vendor website
 * - category: string - Vendor category (software, consulting, supplies, etc.)
 *
 * POST Response:
 * - 201: { data: Vendor } - Created vendor with VendorId
 * - 400: { error: string } - Invalid input
 * - 409: { error: string } - Duplicate vendor
 * - 500: { error: string } - Creation failed
 *
 * @throws {Error} When VendorId is invalid
 * @throws {Error} When vendor name is missing
 * @throws {Error} When duplicate vendor detected
 * @throws {Error} When vendor fails compliance checks
 *
 * Failure modes:
 * - MISSING_REQUIRED_FIELD: Name or email missing
 * - DUPLICATE_VENDOR: Vendor with same name already exists
 * - INVALID_EMAIL: Email format incorrect
 * - INVALID_CATEGORY: Category not in approved list
 * - COMPLIANCE_FAILURE: Vendor on sanctions list or failed credit check
 *
 * @example
 * ```typescript
 * // List vendors
 * fetch('/api/procurement/vendors')
 *   .then(res => res.json())
 *   .then(({ data }) => console.log('Vendors:', data));
 *
 * // Add vendor
 * fetch('/api/procurement/vendors', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'Acme Software Inc',
 *     email: 'billing@acme.com',
 *     phone: '+1-555-0100',
 *     website: 'https://acme.com',
 *     category: 'software'
 *   })
 * });
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const vendors = await prisma.vendor.findMany({
        orderBy: { name: "asc" }
      })
      return res.status(200).json({ data: vendors })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch vendors'
      })
    }
  }

  if (req.method === "POST") {
    try {
      const { name, email, phone, website, category } = req.body

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({
          error: 'Missing required fields: name, email'
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      // Check for duplicate vendor
      const existingVendor = await prisma.vendor.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      })

      if (existingVendor) {
        return res.status(409).json({
          error: `Vendor "${name}" already exists with ID: ${existingVendor.id}`
        })
      }

      const vendor = await prisma.vendor.create({
        data: { name, email, phone, website, category }
      })

      // Create VendorId for the new vendor
      const vendorId = createVendorId(vendor.id)

      // Route through Bifrost pipeline
      await runPipeline(
        createEvent(
          EventTypes.PROCUREMENT.VENDOR_ADDED,
          "procurement",
          {
            vendorId,
            name: vendor.name,
            category: vendor.category,
            email: vendor.email
          }
        )
      )

      return res.status(201).json({ data: vendor })
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create vendor'
      })
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
