import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DesignSystemDemo() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Design System Comparison</h1>
        <p className="text-muted-foreground">Choose between Aurora (Glass & Glow) or Electric Indigo design systems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Aurora System */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Aurora System</h2>
          <p className="text-sm text-muted-foreground text-center">Glass & Glow aesthetic with purple-pink gradients</p>
          
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="aurora-gradient bg-clip-text text-transparent">Aurora Card</CardTitle>
              <CardDescription>Glassmorphism with Aurora gradient effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Primary Aurora Button</Button>
              <Button variant="secondary" className="w-full">Secondary Glass Button</Button>
              <div className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/20">
                <p className="text-sm text-neon-green font-medium">Success Badge</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Electric Indigo System */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-electric-indigo">Electric Indigo System</h2>
          <p className="text-sm text-muted-foreground text-center">Clean, vibrant design with Electric Indigo primary</p>
          
          <Card variant="electric">
            <CardHeader>
              <CardTitle className="text-electric-indigo">Electric Card</CardTitle>
              <CardDescription>Clean design with Electric Indigo accents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="electric-primary" className="w-full">Primary Electric Button</Button>
              <Button variant="electric-secondary" className="w-full">Secondary Electric Button</Button>
              <div className="p-4 rounded-lg bg-emerald-green/10 border border-emerald-green/20">
                <p className="text-sm text-emerald-green font-medium">Success Badge</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Color Palettes</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium mb-2">Aurora Colors</h4>
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 rounded-full bg-radiant-violet"></div>
              <div className="w-8 h-8 rounded-full bg-neon-green"></div>
              <div className="w-8 h-8 rounded-full bg-bright-amber"></div>
              <div className="w-8 h-8 rounded-full bg-electric-red"></div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Electric Indigo Colors</h4>
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 rounded-full bg-electric-indigo"></div>
              <div className="w-8 h-8 rounded-full bg-emerald-green"></div>
              <div className="w-8 h-8 rounded-full bg-amber"></div>
              <div className="w-8 h-8 rounded-full bg-crimson-red"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
