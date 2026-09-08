import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Package, 
  CreditCard,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function VerifiedBuyersPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/buyers");
      if (res.ok) {
        const data = await res.json();
        setBuyers(data);
      }
    } catch (err) {
      console.error("Failed to load buyers", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Verified Buyers Directory</h1>
              <Badge className="bg-emerald-600 text-white font-semibold">
                Direct B2B Network
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Explore verified institutional buyers, processors, and retailers with verified credentials and transparent payment histories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/buyer-demand">
              <Button variant="outline">
                View Active Demands
              </Button>
            </Link>
            <Link href="/create-lot">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm">
                Create Produce Lot
              </Button>
            </Link>
          </div>
        </div>

        {/* Verification Guarantee Alert */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h3 className="font-bold text-foreground">AgriLink Verified Buyer Guarantee</h3>
            <p className="text-muted-foreground mt-0.5">
              Only businesses with validated GSTIN / FSSAI credentials, verified trade references, and direct bank settlement capabilities are eligible for our direct digital trade workflow.
            </p>
          </div>
        </div>

        {/* Buyers Grid */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading verified buyer directory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buyers.map((buyer) => (
              <Card key={buyer.id} className="flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {buyer.buyerType}
                      </span>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {buyer.businessName}
                      </CardTitle>
                    </div>

                    {buyer.verified ? (
                      <Badge className="bg-emerald-600 text-white text-xs gap-1 px-2 py-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">
                        Under Review
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold mt-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{buyer.reliabilityScore} / 5.0</span>
                    <span className="text-muted-foreground font-normal ml-1">Reliability Score</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm pb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-foreground/70" />
                    <span>{buyer.location}</span>
                  </div>

                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-1">Procured Commodities:</span>
                      <div className="flex flex-wrap gap-1">
                        {buyer.cropsPurchased.map((crop: string) => (
                          <Badge key={crop} variant="secondary" className="text-[11px]">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-muted-foreground">Typical Volume:</span>
                      <strong className="text-foreground">{buyer.typicalQuantity}</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payment Terms:</span>
                      <span className="text-foreground font-medium text-right">{buyer.paymentTerms}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>GSTIN Verified • Direct Escrow / Bank Settlement Enabled</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link href={`/buyer-demand?buyer=${encodeURIComponent(buyer.businessName)}`} className="w-full">
                    <Button variant="outline" className="w-full text-xs font-medium gap-1.5">
                      View Active Orders
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
