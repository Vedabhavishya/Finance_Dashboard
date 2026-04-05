import { useGetMonthlyComparison, getGetMonthlyComparisonQueryKey, useGetSummary, getGetSummaryQueryKey, useGetSpendingByCategory, getGetSpendingByCategoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, Target, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Insights() {
  const { data: monthlyComparison, isLoading: isLoadingMonthly } = useGetMonthlyComparison({
    query: { queryKey: getGetMonthlyComparisonQueryKey() }
  });

  const { data: summary, isLoading: isLoadingSummary } = useGetSummary({
    query: { queryKey: getGetSummaryQueryKey() }
  });

  const { data: spendingByCategory, isLoading: isLoadingCategories } = useGetSpendingByCategory({
    query: { queryKey: getGetSpendingByCategoryQueryKey() }
  });

  if (isLoadingMonthly || isLoadingSummary || isLoadingCategories) {
    return <InsightsSkeleton />;
  }

  if (!monthlyComparison || !summary || !spendingByCategory) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load insights data.</AlertDescription>
      </Alert>
    );
  }

  // Sort categories by amount descending
  const sortedCategories = [...spendingByCategory].sort((a, b) => b.amount - a.amount);
  const totalCategorySpending = sortedCategories.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Insights</h2>
        <p className="text-muted-foreground">Deep dive into your financial habits.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary">Savings Rate</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary.savingsRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: 20% | You are doing {summary.savingsRate >= 20 ? 'great!' : 'okay.'}
            </p>
            <Progress value={Math.min(summary.savingsRate, 100)} className="h-1 mt-3" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{summary.highestSpendingCategory || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest area of expenditure
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Award className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{summary.transactionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total recorded activities
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Monthly income vs expenses comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {monthlyComparison && monthlyComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: number) => formatCurrency(value)}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No monthly data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {sortedCategories.length > 0 ? (
              <div className="space-y-6">
                {sortedCategories.map((cat, index) => {
                  const percentage = totalCategorySpending > 0 ? (cat.amount / totalCategorySpending) * 100 : 0;
                  return (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{cat.category}</span>
                        <span className="text-muted-foreground font-mono tabular-nums">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={percentage} 
                          className="h-2 flex-1" 
                          indicatorClassName={
                            index === 0 ? "bg-chart-1" :
                            index === 1 ? "bg-chart-2" :
                            index === 2 ? "bg-chart-3" :
                            index === 3 ? "bg-chart-4" : "bg-chart-5"
                          } 
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right font-mono">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No spending data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
