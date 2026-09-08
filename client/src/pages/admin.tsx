import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ShieldAlert,
  Users,
  Package,
  ArrowRightLeft,
  CheckCircle2,
  Search,
  Download,
  Building,
  MapPin,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
  });

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  // Fetch all products submitted across all users
  const { data: allProducts = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<any[]>({
    queryKey: ["/api/admin/products"],
    enabled: user?.role === "admin",
  });

  // Fetch all transfers
  const { data: allTransfers = [], isLoading: transfersLoading, refetch: refetchTransfers } = useQuery<any[]>({
    queryKey: ["/api/admin/transfers"],
    enabled: user?.role === "admin",
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchUsers();
    refetchProducts();
    refetchTransfers();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center text-muted-foreground animate-pulse">Loading console...</div>
        </div>
      </div>
    );
  }

  // Access Control: Only Admins
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Administrator Access Required</h1>
          <p className="text-muted-foreground mb-6">
            The multi-user data repository can only be viewed by authenticated users with the <strong>Admin</strong> role.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              Go to Dashboard
            </Button>
            <Button onClick={() => setLocation("/login")}>
              Switch Account
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Filter users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.location?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.company?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter products
  const filteredProducts = allProducts.filter((p) => {
    return (
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.farmName?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.batchId?.toLowerCase().includes(productSearch.toLowerCase())
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200">Admin</Badge>;
      case "farmer":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200">Farmer</Badge>;
      case "distributor":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">Distributor</Badge>;
      case "retailer":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">Retailer</Badge>;
      case "consumer":
        return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200">Consumer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                🛡️ Central Admin Console
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Master Data View
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Restricted portal — viewing all submissions, profiles, and supply chain records from multiple users.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefreshAll} className="self-start sm:self-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Registered Users</p>
                <p className="text-xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalUsers ?? allUsers.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Crops Submitted</p>
                <p className="text-xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalProducts ?? allProducts.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Custody Transfers</p>
                <p className="text-xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalTransfers ?? allTransfers.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Supply Chain Scans</p>
                <p className="text-xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalScans ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multi-User Data Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>All Users ({allUsers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Submitted Produce ({allProducts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span>Transfers ({allTransfers.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS DIRECTORY */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Registered Users Directory</CardTitle>
                    <CardDescription>
                      Full profile data explicitly input by users on registration.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-48 sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        className="pl-8 h-9 text-sm"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="h-9 px-3 text-xs rounded-md border border-input bg-background"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="farmer">Farmers</option>
                      <option value="distributor">Distributors</option>
                      <option value="retailer">Retailers</option>
                      <option value="consumer">Consumers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {usersLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading users directory...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No users found matching your filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Contact (Phone/Email)</TableHead>
                          <TableHead>Farm / Business</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Registered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm text-foreground">{u.name}</p>
                                <p className="text-xs text-muted-foreground">@{u.username || "user"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(u.role)}</TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{u.email}</span>
                                </div>
                                {u.phone && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{u.phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.company ? (
                                <div className="flex items-center gap-1 text-xs">
                                  <Building className="h-3 w-3 text-muted-foreground" />
                                  <span>{u.company}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {u.location ? (
                                <div className="flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span>{u.location}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SUBMITTED PRODUCE */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">All Produce Submissions</CardTitle>
                    <CardDescription>
                      Master ledger of all crop batches registered by farmers across the platform.
                    </CardDescription>
                  </div>

                  <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search produce, farm, batch..."
                      className="pl-8 h-9 text-sm"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {productsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading submitted produce...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No crops registered yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Crop Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Farm & Location</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Batch ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm text-foreground">{p.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {p.id.slice(0, 8)}...</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {p.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <p className="font-medium">{p.farmName}</p>
                                <p className="text-muted-foreground">{p.location}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {p.quantity} {p.unit}
                            </TableCell>
                            <TableCell className="text-sm">
                              {p.price ? `₹${p.price}` : "—"}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                {p.batchId || "—"}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs uppercase">
                                {p.status || "registered"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setLocation(`/product/${p.id}`)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TRANSFERS & CUSTODY */}
          <TabsContent value="transfers">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Supply Chain Custody Transfers</CardTitle>
                <CardDescription>
                  Audit log of ownership transfers and custody requests between users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transfersLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading transfers log...</div>
                ) : allTransfers.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No custody transfers recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transfer ID</TableHead>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Sender ID</TableHead>
                          <TableHead>Recipient ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransfers.map((t) => (
                          <TableRow key={t.id || t._id}>
                            <TableCell>
                              <code className="text-xs font-mono">{String(t.id || t._id).slice(0, 8)}...</code>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs font-mono">{t.productId?.slice(0, 8)}...</code>
                            </TableCell>
                            <TableCell className="text-xs">{t.fromUserId || "Owner"}</TableCell>
                            <TableCell className="text-xs">{t.toUserId || "Buyer"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={t.status === "accepted" ? "default" : "secondary"}
                                className="text-xs capitalize"
                              >
                                {t.status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
