import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Star, Repeat } from "lucide-react";
import { Link } from "wouter";

interface QuickActionsProps {
  needsCaptain: boolean;
  hasTransfers: boolean;
  transfersAvailable: number;
}

export function QuickActions({ needsCaptain, hasTransfers, transfersAvailable }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          <CardTitle>Quick Actions Needed</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {needsCaptain && (
            <Link href="/team">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Select Captain</span>
              </Button>
            </Link>
          )}
          {hasTransfers && (
            <Link href="/transfers">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                <span>{transfersAvailable} Free Transfer{transfersAvailable !== 1 && 's'} Available</span>
              </Button>
            </Link>
          )}
          {!needsCaptain && !hasTransfers && (
            <p className="text-sm text-muted-foreground text-center">
              No immediate actions needed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
