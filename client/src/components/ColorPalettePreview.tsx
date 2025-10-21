import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ColorPalettePreview() {
  const colors = [
    { name: "Deep Red", hex: "#BF092F", cssVar: "--deep-red", description: "Primary color for buttons and highlights" },
    { name: "Dark Navy", hex: "#132440", cssVar: "--dark-navy", description: "Secondary color for backgrounds and text" },
    { name: "Medium Blue", hex: "#16476A", cssVar: "--medium-blue", description: "Accent color for borders and elements" },
    { name: "Teal", hex: "#3B9797", cssVar: "--teal", description: "Accent color for highlights and interactive elements" },
  ];

  return (
    <Card variant="colorhunt" className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center colorhunt-gradient bg-clip-text text-transparent">
          Color Hunt Palette Implementation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {colors.map((color) => (
            <div key={color.name} className="text-center">
              <div 
                className="w-full h-24 rounded-lg mb-3 shadow-lg"
                style={{ backgroundColor: color.hex }}
              />
              <h3 className="font-semibold text-foreground">{color.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{color.hex}</p>
              <p className="text-xs text-muted-foreground mt-1">{color.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 rounded-lg colorhunt-gradient">
          <h3 className="text-white font-semibold mb-2">Gradient Preview</h3>
          <div className="h-16 rounded-lg colorhunt-gradient shadow-colorhunt"></div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="h-12 rounded-lg colorhunt-button-primary mb-2 flex items-center justify-center text-white font-medium">
              Primary Button
            </div>
            <p className="text-xs text-muted-foreground">Deep Red Background</p>
          </div>
          <div className="text-center">
            <div className="h-12 rounded-lg colorhunt-button-secondary mb-2 flex items-center justify-center text-white font-medium">
              Secondary Button
            </div>
            <p className="text-xs text-muted-foreground">Dark Navy Background</p>
          </div>
          <div className="text-center">
            <div className="h-12 rounded-lg colorhunt-button-accent mb-2 flex items-center justify-center text-white font-medium">
              Accent Button
            </div>
            <p className="text-xs text-muted-foreground">Teal Background</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
