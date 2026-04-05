import { useState } from "react";
import { useListTransactions, getListTransactionsQueryKey, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, Transaction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { useRoleStore } from "@/lib/role-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Trash2, Edit2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function TransactionForm({ 
  initialData, 
  onSuccess,
  onClose
}: { 
  initialData?: Transaction; 
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isEditing = !!initialData;
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const { toast } = useToast();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData ? {
      description: initialData.description,
      amount: initialData.amount,
      type: initialData.type,
      category: initialData.category,
      date: initialData.date.split('T')[0],
    } : {
      description: "",
      amount: undefined as any,
      type: "expense",
      category: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: initialData.id, data }, {
        onSuccess: () => {
          toast({ title: "Transaction updated" });
          onSuccess();
          onClose();
        },
        onError: () => toast({ title: "Failed to update transaction", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Transaction created" });
          onSuccess();
          onClose();
        },
        onError: () => toast({ title: "Failed to create transaction", variant: "destructive" })
      });
    }
  };

  const categories = form.watch("type") === "expense" 
    ? ["Food", "Housing", "Transportation", "Utilities", "Insurance", "Medical", "Savings", "Personal", "Debt", "Entertainment"]
    : ["Salary", "Bonus", "Interest", "Dividends", "Gifts", "Other"];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input type="number" step="0.01" className="pl-7" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Grocery shopping..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? "Save Changes" : "Create Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Transactions() {
  const { role } = useRoleStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"income" | "expense" | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { data: transactions, isLoading } = useListTransactions({
    search: search || undefined,
    type: type !== "all" ? type : undefined,
    sortBy,
    sortOrder
  }, {
    query: {
      queryKey: getListTransactionsQueryKey({
        search: search || undefined,
        type: type !== "all" ? type : undefined,
        sortBy,
        sortOrder
      })
    }
  });

  const deleteMutation = useDeleteTransaction();

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Transaction deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" })
    });
  };

  const onMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/insights/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/insights/balance-trend"] });
    queryClient.invalidateQueries({ queryKey: ["/api/insights/spending-by-category"] });
    queryClient.invalidateQueries({ queryKey: ["/api/insights/monthly-comparison"] });
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Manage and track your income and expenses.</p>
        </div>
        
        {role === "admin" && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <TransactionForm 
                onSuccess={onMutationSuccess} 
                onClose={() => setIsAddOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search description or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-muted-foreground ml-2 hidden sm:block" />
            
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="shrink-0 bg-background"
            >
              <ArrowDownRight className={`w-4 h-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {role === "admin" && <TableHead className="w-[100px] text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    {role === "admin" && <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>}
                  </TableRow>
                ))
              ) : transactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === "admin" ? 5 : 4} className="h-40 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="font-medium whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal capitalize">{tx.category}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold tabular-nums whitespace-nowrap ${tx.type === 'income' ? 'text-primary' : ''}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    {role === "admin" && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditingTx(tx)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this transaction? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(tx.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <TransactionForm 
              initialData={editingTx} 
              onSuccess={onMutationSuccess} 
              onClose={() => setEditingTx(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
