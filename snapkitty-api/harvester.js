const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const OPEN_COLLECTIVE_GRAPHQL = "https://api.opencollective.com/graphql/v2";
const COLLECTIVE_SLUG = "snapkitty";

async function harvestOpenCollective() {
  console.log("[HARVESTER] Starting Open Collective harvest...");

  const query = `
    query getCollective($slug: String!) {
      account(slug: $slug) {
        name
        type
        stats {
          balance {
            valueInCents
            currency
          }
          annualBudget {
            usedAmount {
              valueInCents
            }
            plannedAmount {
              valueInCents
            }
          }
        }
        transactions {
          nodes {
            amount {
              valueInCents
            }
            type
          }
        }
      }
    }
  `;

  const response = await fetch(OPEN_COLLECTIVE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { slug: COLLECTIVE_SLUG } })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || (result.errors && result.errors.length > 0)) {
    console.error("[HARVESTER] GraphQL error:", result.errors?.[0]?.message || "Unknown error");
    return null;
  }

  const account = result.data?.account;
  if (!account) {
    console.error("[HARVESTER] No account found for slug:", COLLECTIVE_SLUG);
    return null;
  }

  console.log("[HARVESTER] Account:", account.name);
  console.log("[HARVESTER] Balance:", account.stats?.balance?.valueInCents, "cents");

  return {
    name: account.name,
    type: account.type,
    balanceInCents: Number(account.stats?.balance?.valueInCents || 0),
    currency: account.stats?.balance?.currency || "USD"
  };
}

async function updateEntityFromHarvest(entityName, harvestData) {
  if (!harvestData) return null;

  const existingEntity = await prisma.entity.findFirst({
    where: { name: entityName }
  });

  const balanceCents = BigInt(harvestData.balanceInCents);

  if (existingEntity) {
    const updated = await prisma.entity.update({
      where: { id: existingEntity.id },
      data: {
        balance: balanceCents,
        updatedAt: new Date()
      }
    });
    console.log("[HARVESTER] Updated entity:", entityName, "→", harvestData.balanceInCents, "cents");
    return updated;
  } else {
    const created = await prisma.entity.create({
      data: {
        name: entityName,
        type: harvestData.type || "collective",
        currency: harvestData.currency || "USD",
        balance: balanceCents,
        vault: 0n
      }
    });
    console.log("[HARVESTER] Created entity:", entityName, "→", harvestData.balanceInCents, "cents");
    return created;
  }
}

async function runFullHarvester() {
  try {
    console.log("[HARVESTER] === Full Harvest Cycle ===");

    const harvestData = await harvestOpenCollective();

    if (harvestData) {
      await updateEntityFromHarvest("Digital Inclusion Fund", harvestData);

      console.log("[HARVESTER] Cycle complete:", new Date().toISOString());
    } else {
      console.log("[HARVESTER] No data harvested");
    }
  } catch (error) {
    console.error("[HARVESTER] Error:", error.message);
  }
}

if (require.main === module) {
  runFullHarvester()
    .then(() => prisma.$disconnect())
    .catch(console.error)
    .finally(() => process.exit(0));
}

module.exports = { harvestOpenCollective, updateEntityFromHarvest, runFullHarvester };