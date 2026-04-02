import { useState, useMemo, useEffect } from "react";
import { useProfiles, useCategoryAnalytics, useTrendAnalytics, useDailySpendingPattern, useTransactions, useAnalyticsSummary, useBudget, useDebtAnalytics, useSplitBillAnalytics } from "@/hooks/use-fin-track";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { TrendingUp, Zap, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Analytics() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, refetch: refetchAuth } = useAuth();
  const { data: profiles, isLoading: isProfilesLoading } = useProfiles();
  const activeProfileId = (user as any)?.activeProfileId as number | undefined;
  const activeProfile = profiles?.find((p: any) => p.id === activeProfileId) || profiles?.[0];
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Separate state for export date range
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");

  const monthOptions = useMemo(() => [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ], []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const [trendType, setTrendType] = useState<'monthly' | 'yearly' | '3y' | '5y' | 'alltime'>('monthly');
  const [dailySpendingPeriod, setDailySpendingPeriod] = useState<'monthly' | 'yearly' | '3y' | '5y' | 'alltime'>('monthly');
  const { data: categoryData, isLoading: isCatLoading } = useCategoryAnalytics(activeProfile?.id, selectedMonth, selectedYear);
  const { data: trendData, isLoading: isTrendLoading } = useTrendAnalytics(activeProfile?.id, trendType);
  const { data: dailyData, isLoading: isDailyLoading } = useDailySpendingPattern(activeProfile?.id, dailySpendingPeriod);
  const { data: transactions, isLoading: isTxLoading } = useTransactions(activeProfile?.id, { month: selectedMonth, year: selectedYear });
  const { data: allTransactions, isLoading: isAllTxLoading } = useTransactions(activeProfile?.id);
  const { data: summary, isLoading: isSummaryLoading } = useAnalyticsSummary(activeProfile?.id, selectedMonth, selectedYear);
  const { data: budget } = useBudget(activeProfile?.id, selectedMonth, selectedYear);
  const { data: debtData, isLoading: isDebtLoading } = useDebtAnalytics(activeProfile?.id, selectedMonth, selectedYear);
  const { data: splitData, isLoading: isSplitLoading } = useSplitBillAnalytics(activeProfile?.id, selectedMonth, selectedYear);

  useEffect(() => {
    // Sync check if needed, but the hook should handle it.
  }, [user?.activeProfileId]);

  const isProfilesReady = !isAuthLoading && !isProfilesLoading;

  const isPro = (user as any)?.subscriptionStatus === 'paid';
  const savingsRate = summary?.income ? Math.max(0, ((summary.income - summary.expenses) / summary.income) * 100) : 0;
  const budgetDiscipline = budget && summary?.expenses !== undefined ? Math.max(0, 100 - Math.min(100, (Number(summary.expenses) / Number(budget.amount)) * 100)) : 100;

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!activeProfile) return;
    
    if (!exportStartDate || !exportEndDate) {
      toast({ 
        title: "Please select a date range", 
        description: "Select both start and end dates before downloading.",
        variant: "destructive"
      });
      return;
    }

    // Validate that start date is before end date
    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      toast({ 
        title: "Invalid date range", 
        description: "Start date must be before end date.",
        variant: "destructive"
      });
      return;
    }
    
    const params = new URLSearchParams({
      format,
      startDate: exportStartDate,
      endDate: exportEndDate
    });
    
    if (format === 'csv') {
      window.open(`/api/profiles/${activeProfile.id}/export?${params}`, '_blank');
    } else {
      try {
        const res = await fetch(`/api/profiles/${activeProfile.id}/export?${params}`);
        if (!res.ok) return;
        const payload = await res.json();
        const txData: any[] = payload.transactions || [];
        const debtData2: any[] = payload.debts || [];
        const splitData2: any[] = payload.billSplits || [];

        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- Helper: draw a donut chart using canvas ---
        const drawDonutChart = (
          title: string,
          items: { label: string; value: number; color: [number, number, number] }[],
          startYPos: number
        ): number => {
          if (items.length === 0) return startYPos;
          let y = startYPos;
          if (y > 220) { doc.addPage(); y = 15; }
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(title, 14, y);
          y += 8;

          const total = items.reduce((sum, i) => sum + i.value, 0);
          if (total === 0) return y + 10;

          // Create canvas donut chart
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d')!;

          const cx = 50;
          const cy = 50;
          const outerR = 40;
          const innerR = 24;

          let angle = -Math.PI / 2;
          items.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const [r, g, b] = item.color;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, angle, angle + sliceAngle);
            ctx.lineTo(cx + innerR * Math.cos(angle + sliceAngle), cy + innerR * Math.sin(angle + sliceAngle));
            ctx.arc(cx, cy, innerR, angle + sliceAngle, angle, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            angle += sliceAngle;
          });

          // Convert canvas to image
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 20, y, 30, 30);

          // Add legend below chart
          let legendStartY = y + 35;
          let currentLegendY = legendStartY;
          
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const col = i % 2;
            
            if (col === 0) {
              currentLegendY = legendStartY + Math.floor(i / 2) * 7;
            }

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            const [r, g, b] = item.color;
            doc.setFillColor(r, g, b);
            const xPos = 14 + col * 95;
            doc.rect(xPos, currentLegendY, 3, 3, 'F');
            doc.setTextColor(60, 60, 60);
            doc.text(`${item.label}`, xPos + 6, currentLegendY + 2);
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text(`Rs. ${item.value.toLocaleString('en-IN')}`, xPos + 6, currentLegendY + 5);
          }

          const legendRowCount = Math.ceil(items.length / 2);
          return legendStartY + legendRowCount * 7 + 8;
        };

        // --- Compute chart data from transactions ---
        const groupBy = (arr: any[], key: (item: any) => string) =>
          arr.reduce((acc: Record<string, number>, item) => {
            const k = key(item);
            acc[k] = (acc[k] || 0) + Math.abs(Number(item.amount));
            return acc;
          }, {});

        const chartColors: [number, number, number][] = [
          [16, 185, 129], [14, 165, 233], [245, 158, 11],
          [239, 68, 68], [139, 92, 246], [236, 72, 153], [99, 102, 241]
        ];

        const expenses = txData.filter(t => t.type === 'expense');
        const incomes = txData.filter(t => t.type === 'income');

        const spendByCat = groupBy(expenses, t => t.category?.name || 'Uncategorized');
        const incomeByCat = groupBy(incomes, t => t.category?.name || 'Uncategorized');

        const toBarItems = (obj: Record<string, number>) =>
          Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value], i) => ({ label, value, color: chartColors[i % chartColors.length] }));

        // Monthly trend
        const monthlyTrend = groupBy(expenses, t => {
          const d = new Date(t.date);
          return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
        });
        const trendItems = Object.entries(monthlyTrend)
          .sort((a, b) => new Date('1 ' + a[0]).getTime() - new Date('1 ' + b[0]).getTime())
          .map(([label, value], i) => ({ label, value, color: chartColors[i % chartColors.length] as [number, number, number] }));

        // Daily spending pattern (day of week)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayTotals: Record<string, number> = {};
        dayNames.forEach(d => { dayTotals[d] = 0; });
        expenses.forEach(t => { const d = dayNames[new Date(t.date).getDay()]; dayTotals[d] += Math.abs(Number(t.amount)); });
        const dailyItems = dayNames.map((d, i) => ({ label: d, value: dayTotals[d], color: chartColors[i % chartColors.length] as [number, number, number] }));

        // Debt breakdown
        const debtByContact = groupBy(debtData2, d => d.contactName || 'Unknown');
        const debtBarItems = toBarItems(debtByContact);

        // Split bill breakdown
        const splitByDesc = splitData2.map((s: any, i: number) => ({
          label: s.description || 'Split',
          value: Math.abs(Number(s.totalAmount)),
          color: chartColors[i % chartColors.length] as [number, number, number]
        }));

        // =============================================
        // PAGE 1: TITLE + LEDGER TRANSACTIONS TABLE
        // =============================================
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text("FinTrack - Financial Report", 14, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Profile: ${activeProfile.name}   |   Period: ${exportStartDate} to ${exportEndDate}`, 14, 22);

        // Section: Ledger Transactions
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text("Ledger Transactions", 14, 32);

        autoTable(doc, {
          startY: 37,
          head: [['Date', 'Category', 'Note', 'Type', 'Amount']],
          headStyles: { fillColor: [226, 232, 240], textColor: [30, 30, 30], fontStyle: 'bold' },
          body: txData.map((tx: any) => [
            new Date(tx.date).toLocaleDateString(),
            tx.category?.name || 'Uncategorized',
            tx.note || '',
            tx.type.toUpperCase(),
            `Rs. ${Math.abs(Number(tx.amount)).toLocaleString('en-IN')}`
          ]),
          didParseCell: (hookData: any) => {
            const tx = txData[hookData.row.index];
            if (tx && hookData.column.index === 4 && hookData.section === 'body') {
              hookData.cell.styles.textColor = tx.type === 'income' ? [16, 185, 129] : [239, 68, 68];
            }
          },
          styles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // =============================================
        // SECTION: UDHARI KHATA
        // =============================================
        let currentY = (doc as any).lastAutoTable.finalY + 12;
        if (currentY > 250) { doc.addPage(); currentY = 15; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text("Udhari Khata (Debt Transactions)", 14, currentY);

        if (debtData2.length === 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text("No debt transactions in this date range.", 14, currentY + 8);
          currentY += 18;
        } else {
          autoTable(doc, {
            startY: currentY + 5,
            head: [['Date', 'Contact', 'Phone', 'Type', 'Note', 'Status', 'Amount']],
            headStyles: { fillColor: [226, 232, 240], textColor: [30, 30, 30], fontStyle: 'bold' },
            body: debtData2.map((d: any) => [
              new Date(d.date).toLocaleDateString(),
              d.contactName || '',
              d.contactPhone || '',
              d.type === 'gave' ? 'Gave' : 'Got',
              d.note || '',
              d.status?.toUpperCase() || '',
              `Rs. ${Math.abs(Number(d.amount)).toLocaleString('en-IN')}`
            ]),
            didParseCell: (hookData: any) => {
              const d = debtData2[hookData.row.index];
              if (d && hookData.column.index === 6 && hookData.section === 'body') {
                hookData.cell.styles.textColor = d.type === 'got' ? [16, 185, 129] : [239, 68, 68];
              }
            },
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
          currentY = (doc as any).lastAutoTable.finalY + 12;
        }

        // =============================================
        // SECTION: SPLIT BILL
        // =============================================
        if (currentY > 250) { doc.addPage(); currentY = 15; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text("Split Bill Transactions", 14, currentY);

        if (splitData2.length === 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text("No split bill transactions in this date range.", 14, currentY + 8);
          currentY += 18;
        } else {
          const splitTableBody: any[] = [];
          splitData2.forEach((s: any) => {
            // First row: the bill itself
            splitTableBody.push([
              new Date(s.date).toLocaleDateString(),
              s.description || '',
              'Total',
              '',
              '',
              `Rs. ${Math.abs(Number(s.totalAmount)).toLocaleString('en-IN')}`
            ]);
            // Participant sub-rows
            (s.participants || []).forEach((p: any) => {
              splitTableBody.push([
                '',
                `  ↳ ${p.contactName || ''}`,
                'Share',
                p.contactPhone || '',
                p.isSettled ? 'Settled' : 'Pending',
                `Rs. ${Math.abs(Number(p.amount)).toLocaleString('en-IN')}`
              ]);
            });
          });
          autoTable(doc, {
            startY: currentY + 5,
            head: [['Date', 'Description', 'Row Type', 'Phone', 'Status', 'Amount']],
            headStyles: { fillColor: [226, 232, 240], textColor: [30, 30, 30], fontStyle: 'bold' },
            body: splitTableBody,
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
          });
          currentY = (doc as any).lastAutoTable.finalY + 12;
        }

        // =============================================
        // SECTION: CHARTS (new page)
        // =============================================
        doc.addPage();
        let chartY = 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text("Analytics Charts", 14, chartY);
        chartY += 10;

        chartY = drawDonutChart("Spending by Category", toBarItems(spendByCat), chartY);
        chartY = drawDonutChart("Income by Category", toBarItems(incomeByCat), chartY);
        chartY = drawDonutChart("Udhari Khata (Debt) Breakdown", debtBarItems, chartY);
        chartY = drawDonutChart("Split Bill Breakdown", splitByDesc, chartY);
        chartY = drawDonutChart("Spending Trend (Monthly)", trendItems, chartY);
        chartY = drawDonutChart("Daily Spending Pattern", dailyItems, chartY);

        doc.save(`FinTrack-Report-${activeProfile.name}-${exportStartDate}-to-${exportEndDate}.pdf`);
      } catch (error) {
        console.error('PDF Export Error:', error);
        toast({ 
          title: "PDF export failed", 
          description: "There was an error generating your PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };


  // Format expense and income chart data
  const expenseChartData = (categoryData as any)?.expenses?.map((item: any, index: number) => ({
    ...item,
    value: Math.abs(Number(item.value)),
    fill: item.color || COLORS[index % COLORS.length]
  })) || [];

  const incomeChartData = (categoryData as any)?.income?.map((item: any, index: number) => ({
    ...item,
    value: Math.abs(Number(item.value)),
    fill: item.color || COLORS[index % COLORS.length]
  })) || [];

  const debtChartData = debtData?.map((item: any, index: number) => ({
    ...item,
    value: Math.abs(Number(item.value)),
    fill: COLORS[index % COLORS.length]
  })) || [];

  const splitChartData = splitData?.map((item: any, index: number) => ({
    ...item,
    value: Number(item.amount),
    fill: COLORS[index % COLORS.length]
  })) || [];

  return (
    <div className="pb-24 md:pb-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground mt-1">Visualize your habits for {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(val) => setSelectedMonth(parseInt(val))}
            >
              <SelectTrigger className="w-[130px] h-9 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedYear.toString()} 
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="w-[100px] h-9 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 rounded-2xl border-border shadow-sm bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Savings Rate
            </h3>
            <span className="text-2xl font-bold text-blue-600">{savingsRate.toFixed(1)}%</span>
          </div>
          <Progress value={savingsRate} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground mt-3">Target: 20%+ for healthy growth</p>
        </Card>

        <Card className="p-6 rounded-2xl border-border shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-background">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold font-display flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              Budget Discipline
            </h3>
            <span className="text-2xl font-bold text-emerald-600">{budgetDiscipline.toFixed(1)}%</span>
          </div>
          <Progress value={budgetDiscipline} className="h-2 rounded-full [&>div]:bg-emerald-500" />
          <p className="text-xs text-muted-foreground mt-3">Reflects how well you stick to your limits</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Spending Breakdown */}
        <Card className="p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-lg font-bold font-display mb-6">Spending by Category</h3>
          <div className="h-[300px] w-full">
            {isCatLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹ ${value.toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No expense data available for this month
              </div>
            )}
          </div>
        </Card>

        {/* Income Breakdown */}
        <Card className="p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-lg font-bold font-display mb-6">Income by Category</h3>
          <div className="h-[300px] w-full">
            {isCatLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : incomeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹ ${value.toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No income data available for this month
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Udhari Khata Breakdown */}
        <Card className="p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-lg font-bold font-display mb-6">Udhari Khata (Debt) Breakdown</h3>
          <div className="h-[300px] w-full">
            {isDebtLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : debtChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {debtChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹ ${Math.abs(value).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No Udhari Khata data for this month
              </div>
            )}
          </div>
        </Card>

        {/* Split Bill Breakdown */}
        <Card className="p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-lg font-bold font-display mb-6">Split Bill Breakdown</h3>
          <div className="h-[300px] w-full">
            {isSplitLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
              </div>
            ) : splitChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={splitChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {splitChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹ ${Number(value).toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No Split Bill data for this month
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        {/* Monthly/Yearly Trend */}
        <Card className="p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display">Spending Trend</h3>
            <div className="flex bg-muted p-1 rounded-lg flex-wrap gap-1">
              <button 
                onClick={() => setTrendType('monthly')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", trendType === 'monthly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                6M
              </button>
              <button 
                onClick={() => setTrendType('yearly')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", trendType === 'yearly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                1Y
              </button>
              <button 
                onClick={() => setTrendType('3y')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", trendType === '3y' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                3Y
              </button>
              <button 
                onClick={() => setTrendType('5y')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", trendType === '5y' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                5Y
              </button>
              <button 
                onClick={() => setTrendType('alltime')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", trendType === 'alltime' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                All
              </button>
            </div>
          </div>
          <div className="h-[400px] w-full">
            {isTrendLoading ? (
              <Skeleton className="h-full w-full" />
            ) : trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="expenses" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground">
                No trend data yet
              </div>
            )}
          </div>
        </Card>

        {/* Daily Spending Line Chart */}
        <Card className="p-6 rounded-2xl border border-border shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold font-display">Daily Spending Pattern</h3>
            <div className="flex bg-muted p-1 rounded-lg flex-wrap gap-1">
              <button 
                onClick={() => setDailySpendingPeriod('monthly')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", dailySpendingPeriod === 'monthly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                6M
              </button>
              <button 
                onClick={() => setDailySpendingPeriod('yearly')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", dailySpendingPeriod === 'yearly' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                1Y
              </button>
              <button 
                onClick={() => setDailySpendingPeriod('3y')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", dailySpendingPeriod === '3y' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                3Y
              </button>
              <button 
                onClick={() => setDailySpendingPeriod('5y')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", dailySpendingPeriod === '5y' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                5Y
              </button>
              <button 
                onClick={() => setDailySpendingPeriod('alltime')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", dailySpendingPeriod === 'alltime' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
              >
                All
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {isDailyLoading ? (
              <Skeleton className="h-full w-full" />
            ) : dailyData && dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} hide={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => `₹ ${value.toLocaleString('en-IN')}`}
                  />
                  <Area type="monotone" dataKey="amount" name="Spent" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSpent)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Insufficient data for pattern analysis
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Export Date Range Section */}
      {isPro && (
        <div className="flex items-center gap-3">
          <div className="w-full bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/20 dark:border-primary/30 rounded-xl p-6 flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Export Date Range</label>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <input 
                    type="date" 
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-input rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <input 
                    type="date" 
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-input rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('csv')} 
                className="rounded-lg border-primary/30 hover:bg-primary/10 dark:border-primary/40 dark:hover:bg-primary/20 font-medium"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleExport('pdf')} 
                className="rounded-lg font-medium bg-primary hover:bg-primary/90"
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
