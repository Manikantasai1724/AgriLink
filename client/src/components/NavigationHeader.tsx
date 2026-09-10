import { 
  Bell, 
  ChevronDown, 
  LogOut, 
  Menu, 
  Moon, 
  Sun, 
  User, 
  LayoutDashboard,
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Truck, 
  CreditCard, 
  Scale, 
  Users, 
  QrCode, 
  ShieldCheck, 
  Building2,
  X,
  Layers,
  Sparkles
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
// IMPORT your form components (update paths if needed)
import { DistributorProductForm } from "./DistributorProductForm";
import { OwnershipManagementPanel } from "./OwnershipManagementPanel"; // Import at the top
import { QuickLanguageSwitcher } from "./QuickLanguageSwitcher";
import { RetailerProductForm } from "./RetailerProductForm";

export function NavigationHeader() {
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { user, firebaseUser, logout, loading } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isFirstFetchRef = useRef(true);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());

  // modal states (we'll show forms as overlays)
  const [showDistributorForm, setShowDistributorForm] = useState(false);
  const [showRetailerForm, setShowRetailerForm] = useState(false);
  const [showOwnershipPanel, setShowOwnershipPanel] = useState(false); // <-- new state

  // pending product id so we can redirect after form submit
  const [pendingProductIdForRedirect, setPendingProductIdForRedirect] = useState<string | null>(
    null,
  );

  // store the transfer id & product id for the currently-open form
  const [currentTransferForForm, setCurrentTransferForForm] = useState<{
    transferId?: string;
    productId?: string;
  } | null>(null);

  const [productData, setProductData] = useState<any>(null);

  const [ownershipPanelPrefill, setOwnershipPanelPrefill] = useState<{
    productId?: string;
    toUserId?: string;
    transferId?: string;
    mode?: "product_request" | "simple_transfer";
  } | null>(null); // <-- new state

  const isActiveRoute = (path: string) => location === path;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasPendingTransfers = notifications.some(
    (n) => !n.read && (n.type === "ownership_request" || n.type === "product_request")
  );

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-close mobile drawer when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Fetch unread notifications (we keep only unread in dropdown)
  useEffect(() => {
    let mounted = true;
    async function fetchNotifications() {
      if (!user) return;
      try {
        const token = localStorage.getItem("auth_token") || "";
        const res = await fetch("/api/notifications", {
          headers: {
            "firebase-uid": user.id,
            Authorization: `Bearer ${token}`,
          },
        });
        if (!mounted) return;
        if (res.ok) {
          const data: any[] = (await res.json()) || [];
          setNotifications(data);
          
          const unread = data.filter((n: any) => !n.read);
          setNotificationCount(unread.length);

          // Toast only if it's not the initial load
          if (!isFirstFetchRef.current) {
            unread.forEach((notif) => {
              if (!prevNotifIdsRef.current.has(notif.id)) {
                toast({
                  title: notif.title || "New Notification",
                  description: notif.message,
                });
              }
            });
          } else {
            isFirstFetchRef.current = false;
          }

          // Update the ref with all received notification IDs
          prevNotifIdsRef.current = new Set(data.map((n) => n.id));
        } else {
          setNotifications([]);
          setNotificationCount(0);
        }
      } catch (err) {
        if (!mounted) return;
        setNotifications([]);
        setNotificationCount(0);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, toast]);

  // Prevent background scroll & avoid layout shift when modal opens.
  useEffect(() => {
    const modalOpen = showDistributorForm || showRetailerForm;
    if (!modalOpen) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      return;
    }

    // compute scrollbar width so content doesn't jump
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [showDistributorForm, showRetailerForm]);

  // When opening the modal, fetch product data if productId exists
  useEffect(() => {
    if (currentTransferForForm?.productId) {
      fetch(`/api/products/${currentTransferForForm.productId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setProductData(data))
        .catch(() => setProductData(null));
    } else {
      setProductData(null);
    }
  }, [currentTransferForForm]);

  if (loading) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16 items-center">
            <div className="flex items-center gap-4"></div>
            <div className="animate-pulse font-bold text-primary">AgriLink...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6 min-w-0">
              <div
                className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0 hover:opacity-90 transition-opacity"
                onClick={() => setLocation("/")}
                data-testid="logo-home"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-600 font-bold shadow-xs">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-black text-xl tracking-tight text-emerald-600">
                  Agri<span className="text-foreground">Link</span>
                </span>
              </div>

              {/* Desktop links */}
              <div className="hidden md:flex items-center space-x-1 min-w-0">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActiveRoute("/dashboard")
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                  data-testid="link-dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  href="/market-intelligence"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActiveRoute("/market-intelligence")
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                  data-testid="link-market-intelligence"
                >
                  Market Intelligence
                </Link>
                <Link
                  href="/buyer-demand"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActiveRoute("/buyer-demand")
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                  data-testid="link-buyer-demand"
                >
                  Buyer Demand
                </Link>
                <Link
                  href="/verified-buyers"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActiveRoute("/verified-buyers")
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                  data-testid="link-verified-buyers"
                >
                  Verified Buyers
                </Link>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <QuickLanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-testid="button-theme-toggle"
                className="h-9 w-9 p-0"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setLocation("/login")}
                data-testid="button-login"
                className="hidden sm:flex whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 sm:px-4 h-9 shadow-sm"
              >
                Sign In / Register
              </Button>
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                  className="h-9 w-9 p-0"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu backdrop for logged-out */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-16 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile menu drawer for logged-out */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-16 max-h-[calc(100vh-4rem)] overflow-y-auto z-50 bg-background/95 backdrop-blur-md px-4 py-5 space-y-3 shadow-2xl md:hidden border-b border-border animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute("/dashboard")
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/market-intelligence"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute("/market-intelligence")
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Market Intelligence</span>
              </Link>
              <Link
                href="/buyer-demand"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute("/buyer-demand")
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buyer Demand</span>
              </Link>
              <Link
                href="/verified-buyers"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActiveRoute("/verified-buyers")
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Verified Buyers</span>
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Sparkles className="w-4 h-4" />
                <span>How It Works</span>
              </Link>
            </div>
            <div className="pt-3 border-t border-border">
              <Button
                onClick={() => {
                  setLocation("/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm text-sm"
              >
                Sign In / Register
              </Button>
            </div>
          </div>
        )}
      </nav>
    );
  }

  const userRole = (user.role || "farmer").toLowerCase();
  const isFarmer = ["farmer", "admin"].includes(userRole);
  const isFpo = ["fpo", "admin"].includes(userRole);
  const isBuyer = ["buyer", "distributor", "retailer", "admin"].includes(userRole);
  const isLogistics = ["logistics", "distributor", "admin"].includes(userRole);
  const isAdmin = userRole === "admin";
  const isFarmerOrFpo = isFarmer || isFpo;

  // 1. Primary Top Navigation Links (Role-Adaptive)
  const primaryNavLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
      testid: "link-dashboard",
    },
    {
      href: "/market-intelligence",
      label: "Market Intelligence",
      icon: TrendingUp,
      show: isFarmer || isFpo || isAdmin,
      testid: "link-market-intelligence",
    },
    {
      href: "/buyer-demand",
      label: isBuyer ? "Procurement Demands" : "Buyer Demands",
      icon: ShoppingBag,
      show: isBuyer || isFpo || isFarmer,
      testid: "link-buyer-demand",
    },
    {
      href: "/create-lot",
      label: "Produce Lots",
      icon: Package,
      show: isFarmerOrFpo,
      testid: "link-create-lot",
    },
    {
      href: "/fpo-aggregation",
      label: "FPO Hub",
      icon: Users,
      show: isFpo,
      testid: "link-fpo-hub",
    },
    {
      href: "/offers-matches",
      label: "Offers & Matches",
      icon: Layers,
      show: isFarmer || isBuyer || isFpo || isAdmin,
      testid: "link-offers",
    },
    {
      href: "/logistics-storage",
      label: "Logistics Network",
      icon: Truck,
      show: isLogistics && !isFarmer && !isFpo,
      testid: "link-logistics-primary",
    },
    {
      href: "/admin",
      label: "Admin Console",
      icon: ShieldCheck,
      show: isAdmin,
      testid: "link-admin-primary",
    },
  ];

  // 2. Secondary Operations Dropdown Links
  const operationsLinks = [
    {
      href: "/transactions",
      label: "Transactions & Orders",
      icon: Truck,
      desc: "Live lifecycle & transit status",
      show: true,
      testid: "link-transactions",
    },
    {
      href: "/logistics-storage",
      label: "Logistics & Storage",
      icon: Building2,
      desc: "Local haulers & cold storage",
      show: true,
      testid: "link-logistics",
    },
    {
      href: "/payments",
      label: "Payments & Escrow",
      icon: CreditCard,
      desc: "UTR settlements & payment proof",
      show: true,
      testid: "link-payments",
    },
    {
      href: "/verified-buyers",
      label: "Verified Buyers Directory",
      icon: ShieldCheck,
      desc: "FSSAI & GSTIN verified partners",
      show: true,
      testid: "link-verified-buyers",
    },
    {
      href: "/fpo-aggregation",
      label: "FPO Aggregation Hub",
      icon: Users,
      desc: "Pool smallholder lots for bulk trade",
      show: isFarmerOrFpo,
      testid: "link-fpo",
    },
    {
      href: "/qr-scanner",
      label: "QR Batch Scanner",
      icon: QrCode,
      desc: "Verify provenance & farm batch",
      show: true,
      testid: "link-qr-scanner",
    },
    {
      href: "/disputes",
      label: "Disputes & Grievances",
      icon: Scale,
      desc: "Order resolution & claim audit",
      show: true,
      testid: "link-disputes",
    },
    {
      href: "/admin",
      label: "Admin Console",
      icon: ShieldCheck,
      desc: "System management & verification",
      show: user.role === "admin",
      testid: "link-admin-console",
    },
  ];

  const isOperationsActive = operationsLinks.some((l) => l.show && location === l.href);

  // Remove notification locally (we assume server has been notified already)
  const removeNotificationLocal = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };

  // Accept ownership: mark read & respond server-side, remove locally, open modal form
  const handleAcceptOwnership = async (notif: any) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("auth_token") || "";

      // mark as read server-side
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.id,
          Authorization: `Bearer ${token}`,
        },
      });

      // tell backend we accepted the invitation (this keeps server in sync)
      await fetch(`/api/notifications/${notif.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.id,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "accepted", role: user.role }),
      });

      // remove locally from dropdown
      removeNotificationLocal(notif.id);

      // FLOW 2: Product request (requester → owner)
      if (notif.type === "product_request" && notif.fromUserId) {
        setOwnershipPanelPrefill({
          productId: notif.productId,
          toUserId: notif.fromUserId,
          transferId: notif.transferId ?? notif.id,
          mode: "product_request",
        });
        setShowOwnershipPanel(true);
        return;
      }

      // FLOW 1: Dashboard transfer (owner → recipient)
      setPendingProductIdForRedirect(notif.productId ?? null);
      setCurrentTransferForForm({
        transferId: notif.transferId ?? notif.id,
        productId: notif.productId,
      });

      if (user.role === "distributor") {
        setShowDistributorForm(true);
      } else if (user.role === "retailer") {
        setShowRetailerForm(true);
      } else {
        if (notif.productId) setLocation(`/product/${notif.productId}`);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Action failed",
        description: "Could not accept ownership at the moment. Try again.",
        variant: "destructive",
      });
    }
  };

  // Reject ownership: inform backend, remove locally
  const handleRejectOwnership = async (notif: any) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("auth_token") || "";

      await fetch(`/api/notifications/${notif.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.id,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "rejected", role: user.role }),
      });

      // remove locally
      removeNotificationLocal(notif.id);

      toast({
        title: "Request rejected",
        description: "You rejected the ownership request.",
      });
    } catch (err) {
      console.error("Error rejecting ownership:", err);
      toast({
        title: "Action failed",
        description: "Could not reject ownership. Please try again.",
        variant: "destructive",
      });
    }
  };
  const markNotificationReadLocal = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };
  // Default click behaviour for non-ownership notifications:
  const handleNotificationClick = async (notif: any) => {
    markNotificationReadLocal(notif.id);
    try {
      const token = localStorage.getItem("auth_token") || "";
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user?.id || "",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
    if (notif.productId) setLocation(`/product/${notif.productId}`);
  };

  const handleFormClose = (result?: { submitted?: boolean; productId?: string }) => {
    setShowDistributorForm(false);
    setShowRetailerForm(false);

    // choose redirect target: prefer explicit productId from result, otherwise pendingProductIdForRedirect
    const targetProductId = result?.productId ?? pendingProductIdForRedirect;

    if (result?.submitted && targetProductId) {
      setLocation(`/product/${targetProductId}`);
    }

    // cleanup
    setPendingProductIdForRedirect(null);
    setCurrentTransferForForm(null);
  };

  const sortedNotifications = [...notifications]; // they're unread only

  return (
    <>
      <nav className="bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo + Desktop Primary Nav */}
            <div className="flex items-center gap-6 min-w-0">
              <div
                className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0 hover:opacity-90 transition-opacity"
                onClick={() => setLocation("/dashboard")}
                data-testid="logo-home"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-600 font-bold shadow-xs">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-black text-xl tracking-tight text-emerald-600">
                  Agri<span className="text-foreground">Link</span>
                </span>
              </div>

              {/* Desktop Primary Nav */}
              <div className="hidden lg:flex items-center space-x-1 min-w-0">
                {primaryNavLinks
                  .filter((link) => link.show)
                  .map((link) => {
                    const active = isActiveRoute(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          active
                            ? "text-primary bg-primary/10 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                        }`}
                        data-testid={link.testid}
                      >
                        <span>{link.label}</span>
                        {link.href === "/dashboard" && hasPendingTransfers && (
                          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        )}
                      </Link>
                    );
                  })}

                {/* Operations Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all gap-1.5 h-auto ${
                        isOperationsActive
                          ? "text-primary bg-primary/10 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                      }`}
                      data-testid="button-operations-menu"
                    >
                      <span>Operations</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-xl">
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Supply Chain & Trade Tools
                    </div>
                    <DropdownMenuSeparator className="my-1" />
                    {operationsLinks
                      .filter((link) => link.show)
                      .map((link) => {
                        const Icon = link.icon;
                        const active = isActiveRoute(link.href);
                        return (
                          <DropdownMenuItem key={link.href} asChild className="p-0">
                            <Link
                              href={link.href}
                              className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors w-full ${
                                active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                              }`}
                              data-testid={link.testid}
                            >
                              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold leading-none">{link.label}</span>
                                <span className="text-[11px] text-muted-foreground mt-0.5">{link.desc}</span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Right: Notifications, Theme, User Profile, Mobile Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <QuickLanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-testid="button-theme-toggle"
                className="h-9 w-9 p-0"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Notification Dropdown */}
              <DropdownMenu open={notifDropdownOpen} onOpenChange={setNotifDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 p-0"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse"
                        data-testid="text-notification-count"
                      >
                        {notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-auto shadow-xl">
                  <div className="p-3 font-semibold text-sm flex items-center justify-between">
                    <span>Notifications</span>
                    {notificationCount > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                        {notificationCount} New
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {sortedNotifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-xs">
                      No new notifications.
                    </div>
                  ) : (
                    sortedNotifications.map((notif: any) => {
                      const isOwnershipOrProductRequest =
                        notif.type === "ownership_request" || notif.type === "product_request";
                      const isRead = notif.read;
                      const notifClass = isRead ? "opacity-60 bg-muted/30" : "bg-card";

                      if (isOwnershipOrProductRequest) {
                        return (
                          <div
                            key={notif.id}
                            className={`p-3 border-b last:border-0 ${notifClass}`}
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="font-medium text-xs text-foreground">
                                {notif.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {notif.message}
                              </div>
                              <div className="text-[10px] text-muted-foreground/75">
                                {new Date(notif.createdAt).toLocaleString()}
                              </div>
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40">
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleAcceptOwnership(notif)}
                                    data-testid={`button-accept-${notif.id}`}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs px-2.5"
                                    onClick={() => handleRejectOwnership(notif)}
                                    data-testid={`button-reject-${notif.id}`}
                                  >
                                    Reject
                                  </Button>
                                </div>
                                <span className="text-[10px] text-amber-600 font-semibold">Pending</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <DropdownMenuItem
                          key={notif.id}
                          onClick={() => !isRead && handleNotificationClick(notif)}
                          style={{ cursor: isRead ? "default" : "pointer" }}
                          className={`p-3 ${notifClass}`}
                        >
                          <div>
                            <div className="font-medium text-xs">{notif.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{notif.message}</div>
                            <div className="text-[10px] text-muted-foreground/75 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar & Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1.5 p-1 sm:p-1.5 h-auto rounded-lg hover:bg-muted"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="w-8 h-8 border border-emerald-600/30">
                      <AvatarImage src={user.profileImage || undefined} alt={user.name} />
                      <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left max-w-[120px] truncate leading-tight">
                      <div
                        className="text-xs font-bold text-foreground truncate"
                        data-testid="text-user-name"
                        title={user.name}
                      >
                        {user.name}
                      </div>
                      <div
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 capitalize font-medium truncate"
                        data-testid="text-user-role"
                        title={user.role}
                      >
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5 shadow-xl">
                  <div className="px-2.5 py-1.5 border-b mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild className="cursor-pointer" data-testid="menu-admin">
                      <Link href="/admin" className="flex items-center w-full font-semibold text-primary">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Console
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer" data-testid="menu-profile">
                    <Link href="/profile" className="flex items-center w-full text-xs">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/registered-products" className="flex items-center w-full text-xs">
                      <Package className="mr-2 h-4 w-4" />
                      Registered Products
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout();
                      setLocation("/login");
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Hamburger Toggle */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                  className="h-9 w-9 p-0"
                  data-testid="button-mobile-menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-16 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-16 max-h-[calc(100vh-4rem)] overflow-y-auto z-50 px-4 py-4 space-y-4 bg-background/98 backdrop-blur-md border-b border-border shadow-2xl lg:hidden animate-in slide-in-from-top-2 duration-200">
            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/60">
              <Avatar className="w-10 h-10 border border-emerald-600/30">
                <AvatarImage src={user.profileImage || undefined} alt={user.name} />
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 capitalize">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Category 1: Market & Trading */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Market & Trading
              </span>
              <div className="space-y-1 mt-1">
                {primaryNavLinks
                  .filter((l) => l.show)
                  .map((link) => {
                    const Icon = link.icon;
                    const active = isActiveRoute(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "text-primary bg-primary/10 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`mobile-${link.testid}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Category 2: Supply Chain & Operations */}
            <div className="border-t pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Supply Chain & Operations
              </span>
              <div className="space-y-1 mt-1">
                {operationsLinks
                  .filter((l) => l.show)
                  .map((link) => {
                    const Icon = link.icon;
                    const active = isActiveRoute(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "text-primary bg-primary/10 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`mobile-${link.testid}`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{link.label}</span>
                          <span className="text-[11px] text-muted-foreground font-normal truncate">{link.desc}</span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Category 3: Account & Management */}
            <div className="border-t pt-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Account & Settings
              </span>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/registered-products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Registered Products</span>
              </Link>
              <Button
                variant="outline"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  setLocation("/login");
                }}
                className="w-full mt-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 flex items-center justify-center gap-2 text-xs font-semibold h-10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Modal overlays (fixed, centered) */}
      {(showDistributorForm || showRetailerForm) && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-auto">
          {/* backdrop with blur and semi-opaque dark layer */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              // clicking backdrop cancels forms (keep behavior consistent)
              setShowDistributorForm(false);
              setShowRetailerForm(false);
              setPendingProductIdForRedirect(null);
              setCurrentTransferForForm(null);
            }}
          />

          {/* modal panel — will not shift page content; centered, scrollable if tall */}
          <div className="relative mt-12 mb-12 mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-2xl z-[121]">
            {showDistributorForm && currentTransferForForm && (
              <DistributorProductForm
                isVisible={true}
                onClose={(res) => handleFormClose(res)}
                transferId={currentTransferForForm.transferId}
                productData={productData}
                productId={currentTransferForForm.productId}
              />
            )}
            {showRetailerForm && currentTransferForForm && (
              <RetailerProductForm
                isVisible={true}
                onClose={(res) => handleFormClose(res)}
                transferId={currentTransferForForm.transferId}
                productData={productData}
                productId={currentTransferForForm.productId}
              />
            )}
          </div>
        </div>
      )}

      {/* Ownership Management Panel (fixed, centered) */}
      {showOwnershipPanel && (
        <OwnershipManagementPanel
          isOpen={showOwnershipPanel}
          onOpenChange={setShowOwnershipPanel}
          prefillData={ownershipPanelPrefill}
        />
      )}
      {showScrollTop && (
  <button
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-all"
    aria-label="Scroll to top"
  >
    ↑
  </button>
)}
    </>
  );
}
