export const billYear = "2026";

export const trackerTopics = [
  {
    slug: "tax-proposals",
    title: "Tax proposals",
    eyebrow: "Revenue measures",
    description:
      "Track proposed changes to taxes, levies, exemptions, rates, compliance rules, and how each proposal is described in official documents.",
    watchItems: [
      "New or amended tax rates",
      "Exemptions, zero-rating, and reliefs",
      "Compliance deadlines and penalties",
      "Affected goods, services, and sectors",
    ],
    meaning:
      "This page turns technical tax language into practical questions: what changes, who is affected, when it starts, and where the official text says it.",
  },
  {
    slug: "public-participation",
    title: "Public participation",
    eyebrow: "Citizen views",
    description:
      "Follow opportunities for citizens, businesses, civil society, and counties to submit views before Parliament makes decisions.",
    watchItems: [
      "Official submission deadlines",
      "Committee notices and hearing dates",
      "Memorandum templates and guidance",
      "Public concerns raised in discussion threads",
    ],
    meaning:
      "This page helps people move from reaction to participation by showing what can be submitted, where to send it, and which issues need evidence.",
  },
  {
    slug: "parliament-updates",
    title: "Parliament updates",
    eyebrow: "Legislative progress",
    description:
      "Track the bill's movement through readings, committee work, amendments, reports, votes, and presidential assent.",
    watchItems: [
      "Bill publication and first reading",
      "Committee review and public reports",
      "Proposed amendments",
      "Voting, assent, and commencement dates",
    ],
    meaning:
      "This page explains where the bill is in the law-making process and what each stage means for public input and final implementation.",
  },
  {
    slug: "household-impact",
    title: "Household impact",
    eyebrow: "Everyday cost",
    description:
      "Translate verified proposals into possible effects on household budgets, prices, wages, savings, transport, and essential services.",
    watchItems: [
      "Cost of living signals",
      "Transport, fuel, and utility effects",
      "Consumer goods and services",
      "PAYE, savings, and family income issues",
    ],
    meaning:
      "This page focuses on ordinary-language implications, while staying clear about what is confirmed in the bill and what is only a possible downstream effect.",
  },
  {
    slug: "business-impact",
    title: "Business impact",
    eyebrow: "Enterprise effects",
    description:
      "Organize proposals that may affect employers, SMEs, importers, digital businesses, manufacturers, professionals, and informal traders.",
    watchItems: [
      "Business taxes and deductions",
      "VAT, excise, customs, and import rules",
      "Employer compliance obligations",
      "Sector-specific costs and opportunities",
    ],
    meaning:
      "This page helps business owners see which clauses may change cash flow, pricing, compliance work, and planning assumptions.",
  },
  {
    slug: "county-views",
    title: "County views",
    eyebrow: "Local impact",
    description:
      "Surface how proposals may affect counties, local businesses, agriculture, services, devolved functions, and regional public priorities.",
    watchItems: [
      "County-level economic concerns",
      "Agriculture and local value chains",
      "Regional business and consumer effects",
      "Statements from county leaders and residents",
    ],
    meaning:
      "This page makes space for local interpretation, because a national tax proposal can land differently in Nairobi, Mombasa, Kisumu, Eldoret, Garissa, and smaller towns.",
  },
];

export const summarySections = [
  {
    title: "What the bill is trying to change",
    text:
      "A verified summary should identify the main laws, taxes, fees, exemptions, and procedures the bill proposes to amend.",
  },
  {
    title: "Who may be affected",
    text:
      "Each proposal should be mapped to affected groups such as households, workers, employers, SMEs, importers, professionals, counties, and public institutions.",
  },
  {
    title: "When changes may apply",
    text:
      "The page should separate publication, parliamentary review, assent, commencement dates, and any transition periods that appear in official text.",
  },
  {
    title: "What still needs verification",
    text:
      "Unconfirmed claims, interpretations from public debate, and news summaries should be labelled separately from the bill's official wording.",
  },
];

export const billSectionGroups = [
  {
    title: "Tax area",
    items: ["Income tax", "VAT", "Excise duty", "Customs", "Fees and levies"],
  },
  {
    title: "Affected group",
    items: ["Households", "Employees", "SMEs", "Large businesses", "Counties"],
  },
  {
    title: "Policy theme",
    items: ["Cost of living", "Compliance", "Digital economy", "Trade", "Public services"],
  },
  {
    title: "Source status",
    items: ["Official bill text", "Committee update", "News report", "Public discussion"],
  },
];
