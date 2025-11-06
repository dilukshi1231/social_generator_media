'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect } from 'react';

export interface CaptionSettings {
    enabled: boolean;
    position: 'top' | 'bottom' | 'center';
    fontSize: number;
    textColor: string;
    textOpacity: number;
    bgColor: string;
    bgOpacity: number;
    padding: number;
    maxWidthRatio: number;
    fontFamily: string;
}

export const defaultCaptionSettings: CaptionSettings = {
    enabled: true,
    position: 'bottom',
    fontSize: 40,
    textColor: '#FFFFFF',
    textOpacity: 255,
    bgColor: '#000000',
    bgOpacity: 180,
    padding: 20,
    maxWidthRatio: 0.9,
    fontFamily: 'default',
};

// Map backend font family names to CSS font families
const getFontFamilyCSS = (fontFamily: string): string => {
    const fontMap: { [key: string]: string } = {
        default: 'system-ui, -apple-system, sans-serif',
        roboto: "'Roboto', sans-serif",
        open_sans: "'Open Sans', sans-serif",
        lato: "'Lato', sans-serif",
        montserrat: "'Montserrat', sans-serif",
        poppins: "'Poppins', sans-serif",
        raleway: "'Raleway', sans-serif",
        oswald: "'Oswald', sans-serif",
        ubuntu: "'Ubuntu', sans-serif",
        playfair: "'Playfair Display', serif",
        merriweather: "'Merriweather', serif",
        source_sans: "'Source Sans 3', sans-serif",
        impact: "'Impact', sans-serif",
    };
    return fontMap[fontFamily] || fontMap.default;
};

interface CaptionCustomizerProps {
    settings: CaptionSettings;
    onChange: (settings: CaptionSettings) => void;
    previewCaption?: string;
}

export default function CaptionCustomizer({ settings, onChange, previewCaption }: CaptionCustomizerProps) {
    const updateSetting = <K extends keyof CaptionSettings>(key: K, value: CaptionSettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    // Load Google Fonts dynamically
    useEffect(() => {
        // Check if the font link already exists
        const existingLink = document.querySelector('link[data-google-fonts]');
        if (!existingLink) {
            const link = document.createElement('link');
            link.setAttribute('data-google-fonts', 'true');
            link.href =
                'https://fonts.googleapis.com/css2?family=Roboto:wght@700&family=Open+Sans:wght@700&family=Lato:wght@700&family=Montserrat:wght@700&family=Poppins:wght@700&family=Raleway:wght@700&family=Oswald:wght@700&family=Ubuntu:wght@700&family=Playfair+Display:wght@700&family=Merriweather:wght@700&family=Source+Sans+3:wght@700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }, []);

    return (
        <Card className="w-full border-0 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-slate-900">Caption Embedding</CardTitle>
                        <CardDescription className="text-sm text-slate-600 mt-1">
                            Customize how captions appear on your images
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-xl border border-indigo-100 shadow-sm transition-all hover:shadow-md">
                        <Label
                            htmlFor="caption-toggle"
                            className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
                        >
                            Enable Caption
                        </Label>
                        <Switch
                            id="caption-toggle"
                            checked={settings.enabled}
                            onCheckedChange={(checked: boolean) => updateSetting('enabled', checked)}
                        />
                    </div>
                </div>
            </CardHeader>

            {settings.enabled && (
                <CardContent>
                    <Tabs defaultValue="layout" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="layout">Layout</TabsTrigger>
                            <TabsTrigger value="text">Text Style</TabsTrigger>
                            <TabsTrigger value="background">Background</TabsTrigger>
                        </TabsList>

                        {/* Layout Tab */}
                        <TabsContent value="layout" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Position</Label>
                                <Select value={settings.position} onValueChange={(value: 'top' | 'bottom' | 'center') => updateSetting('position', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top">Top</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="bottom">Bottom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Font Size</Label>
                                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        {settings.fontSize}px
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.fontSize]}
                                    onValueChange={([value]: number[]) => updateSetting('fontSize', value)}
                                    min={20}
                                    max={100}
                                    step={2}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>20px</span>
                                    <span>100px</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Padding</Label>
                                    <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                        {settings.padding}px
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.padding]}
                                    onValueChange={([value]: number[]) => updateSetting('padding', value)}
                                    min={10}
                                    max={50}
                                    step={5}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>10px</span>
                                    <span>50px</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Text Width</Label>
                                    <span className="text-sm font-semibold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                                        {Math.round(settings.maxWidthRatio * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.maxWidthRatio * 100]}
                                    onValueChange={([value]: number[]) => updateSetting('maxWidthRatio', value / 100)}
                                    min={50}
                                    max={100}
                                    step={5}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Text Style Tab */}
                        <TabsContent value="text" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Font Family</Label>
                                <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default (Emoji Support)</SelectItem>
                                        <SelectItem value="roboto">Roboto</SelectItem>
                                        <SelectItem value="open_sans">Open Sans</SelectItem>
                                        <SelectItem value="lato">Lato</SelectItem>
                                        <SelectItem value="montserrat">Montserrat</SelectItem>
                                        <SelectItem value="poppins">Poppins</SelectItem>
                                        <SelectItem value="raleway">Raleway</SelectItem>
                                        <SelectItem value="oswald">Oswald</SelectItem>
                                        <SelectItem value="ubuntu">Ubuntu</SelectItem>
                                        <SelectItem value="playfair">Playfair Display</SelectItem>
                                        <SelectItem value="merriweather">Merriweather</SelectItem>
                                        <SelectItem value="source_sans">Source Sans</SelectItem>
                                        <SelectItem value="impact">Impact</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Text Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={settings.textColor}
                                        onChange={(e) => updateSetting('textColor', e.target.value)}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={settings.textColor}
                                        onChange={(e) => updateSetting('textColor', e.target.value)}
                                        placeholder="#FFFFFF"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Text Opacity</Label>
                                    <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        {Math.round((settings.textOpacity / 255) * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.textOpacity]}
                                    onValueChange={([value]: number[]) => updateSetting('textOpacity', value)}
                                    min={0}
                                    max={255}
                                    step={5}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>0% (Transparent)</span>
                                    <span>100% (Solid)</span>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Background Tab */}
                        <TabsContent value="background" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Background Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={settings.bgColor}
                                        onChange={(e) => updateSetting('bgColor', e.target.value)}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={settings.bgColor}
                                        onChange={(e) => updateSetting('bgColor', e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Background Opacity</Label>
                                    <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                        {Math.round((settings.bgOpacity / 255) * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[settings.bgOpacity]}
                                    onValueChange={([value]: number[]) => updateSetting('bgOpacity', value)}
                                    min={0}
                                    max={255}
                                    step={5}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>0% (Transparent)</span>
                                    <span>100% (Solid)</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Preview */}
                    {previewCaption && (
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-600 rounded-full" />
                                    Live Preview
                                </Label>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    Updates in real-time
                                </span>
                            </div>
                            <div className="relative bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200 shadow-inner overflow-hidden">
                                {/* Decorative background pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
                                </div>

                                {/* Mock image background */}
                                <div
                                    className="relative w-full h-48 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
                                    style={{
                                        alignItems: settings.position === 'top' ? 'flex-start' : settings.position === 'bottom' ? 'flex-end' : 'center',
                                    }}
                                >
                                    {/* Simulated image content */}
                                    <div className="absolute inset-0 opacity-30">
                                        <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                                        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                                        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-white/15 rounded-full blur-xl" />
                                    </div>

                                    {/* Caption overlay */}
                                    <div
                                        className="relative w-full text-center transition-all duration-300 ease-out"
                                        style={{
                                            backgroundColor: `${settings.bgColor}${Math.round((settings.bgOpacity / 255) * 255).toString(16).padStart(2, '0')}`,
                                            color: `${settings.textColor}${Math.round((settings.textOpacity / 255) * 255).toString(16).padStart(2, '0')}`,
                                            fontSize: `${Math.max(14, Math.min(settings.fontSize / 2.5, 24))}px`,
                                            padding: `${Math.max(settings.padding / 2, 8)}px ${settings.padding / 1.5}px`,
                                            maxWidth: `${settings.maxWidthRatio * 100}%`,
                                            fontFamily: getFontFamilyCSS(settings.fontFamily),
                                            fontWeight: 'bold',
                                            lineHeight: '1.4',
                                            backdropFilter: settings.bgOpacity < 200 ? 'blur(8px)' : 'none',
                                        }}
                                    >
                                        {previewCaption}
                                    </div>
                                </div>

                                {/* Info badge */}
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
                                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-200">
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                        <span>Position: {settings.position}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-200">
                                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                                        <span>Font: {settings.fontFamily}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Helper text */}
                            <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1.5">
                                <span>💡</span>
                                <span>Adjust settings above to see changes in real-time</span>
                            </p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
