// ============================================================================
// HELPER FUNCTIONS (exported for use in other route files)
// ============================================================================

// Normalize city names to match benchmark data
export function normalizeCityName(location: string): string {
  const cityMap: Record<string, string> = {
    'San Francisco': 'San Francisco Bay Area',
    'San Francisco, CA': 'San Francisco Bay Area',
    'SF': 'San Francisco Bay Area',
    'Bay Area': 'San Francisco Bay Area',
    'San Francisco Bay Area': 'San Francisco Bay Area',
    'New York': 'New York City',
    'NYC': 'New York City',
    'New York, NY': 'New York City',
    'New York City': 'New York City',
    'LA': 'Los Angeles',
    'Los Angeles, CA': 'Los Angeles',
    'Los Angeles': 'Los Angeles',
    'Chicago, IL': 'Chicago',
    'Chicago': 'Chicago',
    'Seattle, WA': 'Seattle',
    'Seattle': 'Seattle',
  };

  if (cityMap[location]) {
    return cityMap[location];
  }

  const lowerLocation = location.toLowerCase();
  for (const [key, value] of Object.entries(cityMap)) {
    if (lowerLocation.includes(key.toLowerCase())) {
      return value;
    }
  }

  return location;
}

export function generateBudgetRecommendations(
  wedding: any,
  benchmarks: any[],
  budgetCategories: any[]
): string[] {
  const recommendations: string[] = [];
  const totalBudget = wedding.totalBudget ? parseFloat(wedding.totalBudget) : 0;

  if (totalBudget === 0) {
    return ["Set a total budget to receive personalized recommendations"];
  }

  budgetCategories.forEach((bc) => {
    const benchmark = benchmarks.find((b) => b.category === bc.category);
    if (benchmark) {
      const allocated = parseFloat(bc.allocatedAmount);
      const avg = parseFloat(benchmark.averageSpend);
      const min = parseFloat(benchmark.minSpend);
      const max = parseFloat(benchmark.maxSpend);

      if (allocated < min) {
        recommendations.push(
          `Consider increasing ${bc.category} budget: You've allocated $${allocated.toLocaleString()}, but the minimum typical spend in ${wedding.location} is $${min.toLocaleString()}`
        );
      } else if (allocated > max) {
        recommendations.push(
          `${bc.category} budget is above average: You've allocated $${allocated.toLocaleString()}, while the typical maximum is $${max.toLocaleString()}. Consider if this aligns with your priorities.`
        );
      } else if (allocated < avg * 0.8) {
        recommendations.push(
          `${bc.category} allocation is below average: You've budgeted $${allocated.toLocaleString()} vs average of $${avg.toLocaleString()}`
        );
      }
    }
  });

  const essentialCategories = ['Catering', 'Venue', 'Photography', 'DJ'];
  essentialCategories.forEach((cat) => {
    const hasCategory = budgetCategories.some((bc) => bc.category === cat);
    if (!hasCategory) {
      const benchmark = benchmarks.find((b) => b.category === cat);
      if (benchmark) {
        recommendations.push(
          `Add ${cat} to your budget: Average spend in ${wedding.location} is $${parseFloat(benchmark.averageSpend).toLocaleString()}`
        );
      }
    }
  });

  const totalAllocated = budgetCategories.reduce(
    (sum, bc) => sum + parseFloat(bc.allocatedAmount),
    0
  );

  if (totalAllocated < totalBudget * 0.8) {
    recommendations.push(
      `You've only allocated $${totalAllocated.toLocaleString()} of your $${totalBudget.toLocaleString()} budget. Consider planning for additional categories.`
    );
  } else if (totalAllocated > totalBudget) {
    recommendations.push(
      `Budget alert: You've allocated $${totalAllocated.toLocaleString()}, which exceeds your total budget of $${totalBudget.toLocaleString()} by $${(totalAllocated - totalBudget).toLocaleString()}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `Your budget allocation looks well-balanced compared to ${wedding.tradition} wedding benchmarks in ${wedding.location}!`
    );
  }

  return recommendations;
}

// ============================================================================
// LEAD SCORING FUNCTIONS
// ============================================================================

interface LeadScoreInput {
  eventDate?: Date | null;
  estimatedBudget?: string | null;
  guestCount?: number | null;
  tradition?: string | null;
  city?: string | null;
}

interface LeadScores {
  urgencyScore: number;
  budgetFitScore: number;
  qualificationScore: number;
  overallScore: number;
  priority: 'hot' | 'warm' | 'medium' | 'cold';
}

export function calculateLeadScore(lead: LeadScoreInput): LeadScores {
  let urgencyScore = 50;
  if (lead.eventDate) {
    const eventDate = new Date(lead.eventDate);
    const now = new Date();
    const daysUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEvent < 0) {
      urgencyScore = 0;
    } else if (daysUntilEvent <= 30) {
      urgencyScore = 100;
    } else if (daysUntilEvent <= 90) {
      urgencyScore = 85;
    } else if (daysUntilEvent <= 180) {
      urgencyScore = 70;
    } else if (daysUntilEvent <= 365) {
      urgencyScore = 50;
    } else {
      urgencyScore = 30;
    }
  }

  let budgetFitScore = 50;
  if (lead.estimatedBudget) {
    const budget = lead.estimatedBudget.toLowerCase();
    if (budget.includes('50000') || budget.includes('50k') || budget.includes('premium') || budget.includes('luxury')) {
      budgetFitScore = 100;
    } else if (budget.includes('30000') || budget.includes('30k') || budget.includes('high')) {
      budgetFitScore = 85;
    } else if (budget.includes('20000') || budget.includes('20k') || budget.includes('medium')) {
      budgetFitScore = 70;
    } else if (budget.includes('10000') || budget.includes('10k') || budget.includes('budget')) {
      budgetFitScore = 50;
    } else if (budget.includes('5000') || budget.includes('5k') || budget.includes('low')) {
      budgetFitScore = 30;
    }
  }

  let qualificationScore = 0;
  if (lead.eventDate) qualificationScore += 25;
  if (lead.estimatedBudget) qualificationScore += 25;
  if (lead.guestCount) qualificationScore += 25;
  if (lead.tradition || lead.city) qualificationScore += 25;

  const overallScore = Math.round(
    (urgencyScore * 0.4) + 
    (budgetFitScore * 0.3) + 
    (qualificationScore * 0.3)
  );

  let priority: 'hot' | 'warm' | 'medium' | 'cold' = 'medium';
  if (overallScore >= 80) {
    priority = 'hot';
  } else if (overallScore >= 60) {
    priority = 'warm';
  } else if (overallScore >= 40) {
    priority = 'medium';
  } else {
    priority = 'cold';
  }

  return {
    urgencyScore,
    budgetFitScore,
    qualificationScore,
    overallScore,
    priority,
  };
}

export function calculateOverallScore(scores: { urgencyScore: number; budgetFitScore: number; engagementScore: number }): number {
  return Math.round(
    (scores.urgencyScore * 0.35) + 
    (scores.budgetFitScore * 0.25) + 
    (scores.engagementScore * 0.4)
  );
}
