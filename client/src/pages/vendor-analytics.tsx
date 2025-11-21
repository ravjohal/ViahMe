import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Star, CheckCircle, Calendar, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VendorAnalytics() {
  const { user } = useAuth();

  // Fetch vendor profile to get vendor ID
  const { data: vendor } = useQuery({
    queryKey: ['/api/vendors/profile'],
  });

  const vendorId = vendor?.id;

  // Fetch analytics summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/analytics/vendor', vendorId, 'summary'],
    enabled: !!vendorId,
  });

  // Fetch booking trends
  const { data: bookingTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/vendor', vendorId, 'booking-trends'],
    enabled: !!vendorId,
  });

  // Fetch revenue trends
  const { data: revenueTrends, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/analytics/vendor', vendorId, 'revenue-trends'],
    enabled: !!vendorId,
  });

  if (!vendor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Create your vendor profile to view analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your performance and growth</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-analytics-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-analytics-trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Basic Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-total-bookings">{summary?.totalBookings || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary?.confirmedBookings || 0} confirmed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-total-revenue">
                      ${parseFloat(summary?.totalRevenue || '0').toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From confirmed bookings
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-average-rating">
                      {summary?.averageRating || '0.0'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary?.totalReviews || 0} reviews
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="metric-conversion-rate">
                      {summary?.conversionRate || '0.0'}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bookings confirmed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Booking Value */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Booking Value
              </CardTitle>
              <CardDescription>Your typical booking size</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="text-4xl font-bold text-primary" data-testid="metric-avg-booking-value">
                  ${parseFloat(summary?.averageBookingValue || '0').toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Booking Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Booking Trends
              </CardTitle>
              <CardDescription>Bookings over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : bookingTrends && bookingTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Total Bookings" />
                    <Bar dataKey="confirmed" fill="hsl(var(--chart-2))" name="Confirmed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No booking data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trends
              </CardTitle>
              <CardDescription>Revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : revenueTrends && revenueTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Revenue ($)"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No revenue data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
