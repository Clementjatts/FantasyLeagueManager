import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Target, 
  Star, 
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from "lucide-react";

export function ApexDesignSystemDemo() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-apex-green to-volt-magenta bg-clip-text text-transparent">
          Apex Design System
        </h1>
        <p className="text-lg text-slate-gray max-w-2xl mx-auto">
          A vibrant, professional design system built for sports analytics and data-driven applications.
          Featuring Apex Green primary colors, Volt Magenta accents, and modern glassmorphism effects.
        </p>
        <div className="flex justify-center gap-2">
          <Badge className="apex-badge-success">Data-First</Badge>
          <Badge className="apex-badge-neutral">Professional</Badge>
          <Badge className="apex-badge-warning">Energetic</Badge>
        </div>
      </div>

      {/* Color Palette */}
      <Card variant="apex">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-apex-green" />
            Color Palette
          </CardTitle>
          <CardDescription>
            The Apex color system designed for optimal data clarity and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-apex-green flex items-center justify-center">
                <span className="text-white font-semibold">Apex Green</span>
              </div>
              <p className="text-sm text-slate-gray">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-volt-magenta flex items-center justify-center">
                <span className="text-white font-semibold">Volt Magenta</span>
              </div>
              <p className="text-sm text-slate-gray">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-success flex items-center justify-center">
                <span className="text-white font-semibold">Success</span>
              </div>
              <p className="text-sm text-slate-gray">Positive</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-warning flex items-center justify-center">
                <span className="text-white font-semibold">Warning</span>
              </div>
              <p className="text-sm text-slate-gray">Alert</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components Showcase */}
      <Tabs defaultValue="buttons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-6">
          <Card variant="apex">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different button styles for various use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary Action</Button>
                <Button variant="apex-primary">Apex Primary</Button>
                <Button variant="apex-secondary">Apex Secondary</Button>
                <Button variant="volt-accent">Volt Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="apex">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-apex-green" />
                  Performance Card
                </CardTitle>
                <CardDescription>Glassmorphism with Apex styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-gray">Team Performance</span>
                  <span className="text-2xl font-bold text-apex-green">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="flex gap-2">
                  <Badge className="apex-badge-success">Excellent</Badge>
                  <Badge className="apex-badge-neutral">+12% vs last week</Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="apex">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-volt-magenta" />
                  Analytics Card
                </CardTitle>
                <CardDescription>Data visualization with Volt accents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-volt-magenta">1,247</div>
                    <div className="text-sm text-slate-gray">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-apex-green">+89</div>
                    <div className="text-sm text-slate-gray">This Week</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="apex-badge-warning">Trending Up</Badge>
                  <Badge className="apex-badge-success">Top 10%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card variant="apex">
            <CardHeader>
              <CardTitle>Badge System</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="apex-badge-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                  <Badge className="apex-badge-warning">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warning
                  </Badge>
                  <Badge className="apex-badge-destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                  <Badge className="apex-badge-neutral">
                    <Info className="w-3 h-3 mr-1" />
                    Info
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Player Status Examples</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="apex-badge-success">In Form</Badge>
                    <Badge className="apex-badge-warning">Injured</Badge>
                    <Badge className="apex-badge-neutral">Bench</Badge>
                    <Badge className="apex-badge-destructive">Suspended</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card variant="apex">
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and form controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input 
                  id="team-name" 
                  placeholder="Enter your team name"
                  className="focus:ring-apex-green focus:border-apex-green"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input 
                  id="budget" 
                  type="number"
                  placeholder="100.0"
                  className="focus:ring-apex-green focus:border-apex-green"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="apex-primary" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Save Team
                </Button>
                <Button variant="apex-secondary">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Design Principles */}
      <Card variant="apex">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-apex-green" />
            Design Principles
          </CardTitle>
          <CardDescription>
            The core principles that guide the Apex design system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-apex-green">Data-First Clarity</h4>
              <p className="text-sm text-slate-gray">
                Colors and layouts prioritize data visualization and statistical information, 
                ensuring that charts, tables, and metrics are the heroes of the interface.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-volt-magenta">Energetic & Professional</h4>
              <p className="text-sm text-slate-gray">
                The aesthetic balances dynamic excitement with analytical precision, 
                creating a trustworthy yet engaging experience for sports analytics.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-success">Accessibility Standard</h4>
              <p className="text-sm text-slate-gray">
                All color combinations meet WCAG AA contrast standards, 
                ensuring usability for users with different visual needs.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-warning">Modern Aesthetics</h4>
              <p className="text-sm text-slate-gray">
                Leverages glassmorphism, gradients, and modern design trends 
                to create a premium, contemporary feel that reflects current tech standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
