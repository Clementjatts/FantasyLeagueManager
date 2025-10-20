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

export function ElectricDesignSystemDemo() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-cyan to-vibrant-magenta bg-clip-text text-transparent">
          Electric Design System
        </h1>
        <p className="text-lg text-slate-gray max-w-2xl mx-auto">
          A vibrant, bold design system built for tech-focused sports analytics and data-driven applications.
          Featuring Electric Cyan primary colors, Vibrant Magenta accents, and high-saturation colors with modern glassmorphism effects.
        </p>
        <div className="flex justify-center gap-2">
          <Badge className="electric-badge-success">Tech-Focused</Badge>
          <Badge className="electric-badge-neutral">Bold & Vibrant</Badge>
          <Badge className="electric-badge-warning">High Saturation</Badge>
        </div>
      </div>

      {/* Color Palette */}
      <Card variant="electric">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-electric-cyan" />
            Color Palette
          </CardTitle>
          <CardDescription>
            The Electric color system designed for maximum vibrancy and tech-focused appeal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-electric-cyan flex items-center justify-center">
                <span className="text-white font-semibold">Electric Cyan</span>
              </div>
              <p className="text-sm text-slate-gray">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-vibrant-magenta flex items-center justify-center">
                <span className="text-white font-semibold">Vibrant Magenta</span>
              </div>
              <p className="text-sm text-slate-gray">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-success flex items-center justify-center">
                <span className="text-white font-semibold">Bright Mint</span>
              </div>
              <p className="text-sm text-slate-gray">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-warning flex items-center justify-center">
                <span className="text-white font-semibold">Vibrant Amber</span>
              </div>
              <p className="text-sm text-slate-gray">Warning</p>
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
          <Card variant="electric">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different button styles for various use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary Action</Button>
                <Button variant="electric-primary">Electric Primary</Button>
                <Button variant="electric-secondary">Electric Secondary</Button>
                <Button variant="magenta-accent">Magenta Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="electric">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-electric-cyan" />
                  Performance Card
                </CardTitle>
                <CardDescription>Glassmorphism with Electric styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-gray">Team Performance</span>
                  <span className="text-2xl font-bold text-electric-cyan">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="flex gap-2">
                  <Badge className="electric-badge-success">Excellent</Badge>
                  <Badge className="electric-badge-neutral">+12% vs last week</Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="electric">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-vibrant-magenta" />
                  Analytics Card
                </CardTitle>
                <CardDescription>Data visualization with Vibrant accents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-vibrant-magenta">1,247</div>
                    <div className="text-sm text-slate-gray">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-electric-cyan">+89</div>
                    <div className="text-sm text-slate-gray">This Week</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="electric-badge-warning">Trending Up</Badge>
                  <Badge className="electric-badge-success">Top 10%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card variant="electric">
            <CardHeader>
              <CardTitle>Badge System</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="electric-badge-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                  <Badge className="electric-badge-warning">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warning
                  </Badge>
                  <Badge className="electric-badge-destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                  <Badge className="electric-badge-neutral">
                    <Info className="w-3 h-3 mr-1" />
                    Info
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Player Status Examples</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="electric-badge-success">In Form</Badge>
                    <Badge className="electric-badge-warning">Injured</Badge>
                    <Badge className="electric-badge-neutral">Bench</Badge>
                    <Badge className="electric-badge-destructive">Suspended</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card variant="electric">
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
                  className="focus:ring-electric-cyan focus:border-electric-cyan"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input 
                  id="budget" 
                  type="number"
                  placeholder="100.0"
                  className="focus:ring-electric-cyan focus:border-electric-cyan"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="electric-primary" className="flex-1">
                  <Star className="w-4 h-4 mr-2" />
                  Save Team
                </Button>
                <Button variant="electric-secondary">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Design Principles */}
      <Card variant="electric">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-electric-cyan" />
            Design Principles
          </CardTitle>
          <CardDescription>
            The core principles that guide the Electric design system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-electric-cyan">Tech-Focused Innovation</h4>
              <p className="text-sm text-slate-gray">
                Electric Cyan evokes technology, data streams, and modern analytics platforms, 
                creating a cutting-edge feel perfect for sports tech applications.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-vibrant-magenta">Bold & Vibrant</h4>
              <p className="text-sm text-slate-gray">
                High-saturation colors create maximum visual impact and energy, 
                making the interface exciting and engaging for users.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-success">Premium Modern</h4>
              <p className="text-sm text-slate-gray">
                Rich, saturated colors combined with sophisticated glassmorphism 
                create a premium, contemporary feel that reflects current tech trends.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-warning">Maximum Contrast</h4>
              <p className="text-sm text-slate-gray">
                Vibrant colors against clean backgrounds ensure excellent readability 
                and accessibility while maintaining visual excitement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
